"use strict";

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const { parseBalanceText } = require("./balance-parser");

const WALLET_URL = "https://www.packyapi.com/console/topup";
const POLL_MS = 30000;
const SESSION_PARTITION = "persist:packyapi-balance";

let mainWindow = null;
let monitorWindow = null;
let authWindow = null;
let pollTimer = null;
let polling = false;

let balanceState = {
  status: "idle",
  balance: null,
  message: "等待首次刷新",
  lastUpdatedAt: null,
  sourceUrl: WALLET_URL
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publishState(patch) {
  balanceState = {
    ...balanceState,
    ...patch
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("balance:update", balanceState);
  }

  return balanceState;
}

function getWebPreferences(extra = {}) {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    partition: SESSION_PARTITION,
    ...extra
  };
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 560,
    minWidth: 390,
    minHeight: 500,
    backgroundColor: "#00000000",
    frame: false,
    transparent: true,
    hasShadow: true,
    title: "PackyAPI Balance",
    autoHideMenuBar: true,
    webPreferences: getWebPreferences({
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    })
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function ensureMonitorWindow() {
  if (monitorWindow && !monitorWindow.isDestroyed()) {
    return monitorWindow;
  }

  monitorWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    show: false,
    autoHideMenuBar: true,
    webPreferences: getWebPreferences()
  });

  monitorWindow.on("closed", () => {
    monitorWindow = null;
  });

  return monitorWindow;
}

function openLoginWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return;
  }

  authWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 680,
    title: "PackyAPI 登录",
    autoHideMenuBar: true,
    webPreferences: getWebPreferences()
  });

  authWindow.loadURL(WALLET_URL);
  authWindow.on("closed", () => {
    authWindow = null;
    refreshBalance();
  });
}

async function readBalanceFromPage() {
  const win = ensureMonitorWindow();

  await win.loadURL(WALLET_URL);
  await delay(2200);

  const text = await win.webContents.executeJavaScript(
    "document.body ? document.body.innerText : ''",
    true
  );

  const balance = parseBalanceText(text);
  const sourceUrl = win.webContents.getURL();

  if (balance) {
    return {
      status: "ready",
      balance,
      message: "余额已同步",
      lastUpdatedAt: new Date().toISOString(),
      sourceUrl
    };
  }

  const needsLogin = /登录|Sign in|Login|邮箱|密码/.test(text);

  return {
    status: needsLogin ? "needs-login" : "error",
    balance: null,
    message: needsLogin ? "需要登录 PackyAPI" : "没有在页面中找到当前余额",
    lastUpdatedAt: new Date().toISOString(),
    sourceUrl
  };
}

async function refreshBalance() {
  if (polling) {
    return balanceState;
  }

  polling = true;
  publishState({
    status: "loading",
    message: "正在同步余额"
  });

  try {
    return publishState(await readBalanceFromPage());
  } catch (error) {
    return publishState({
      status: "error",
      balance: null,
      message: error.message || "同步失败",
      lastUpdatedAt: new Date().toISOString()
    });
  } finally {
    polling = false;
  }
}

function startPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
  }

  refreshBalance();
  pollTimer = setInterval(refreshBalance, POLL_MS);
}

function getAutoStartOptions(openAtLogin) {
  const options = {
    openAtLogin
  };

  if (process.defaultApp && process.argv.length >= 2) {
    options.path = process.execPath;
    options.args = [path.resolve(process.argv[1])];
  }

  return options;
}

function getAutoStartState() {
  return app.getLoginItemSettings().openAtLogin;
}

function setAutoStartState(enabled) {
  app.setLoginItemSettings(getAutoStartOptions(Boolean(enabled)));
  return getAutoStartState();
}

ipcMain.handle("balance:get-state", () => balanceState);
ipcMain.handle("balance:refresh", () => refreshBalance());
ipcMain.handle("balance:open-login", () => {
  openLoginWindow();
});
ipcMain.handle("balance:open-site", () => shell.openExternal(WALLET_URL));
ipcMain.handle("autostart:get", () => getAutoStartState());
ipcMain.handle("autostart:set", (_event, enabled) => setAutoStartState(enabled));
ipcMain.handle("window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
  }
});
ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});

app.whenReady().then(() => {
  createMainWindow();
  startPolling();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("before-quit", () => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
