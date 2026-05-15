"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("packyBalance", {
  getState: () => ipcRenderer.invoke("balance:get-state"),
  refresh: () => ipcRenderer.invoke("balance:refresh"),
  openLogin: () => ipcRenderer.invoke("balance:open-login"),
  openSite: () => ipcRenderer.invoke("balance:open-site"),
  getAutoStart: () => ipcRenderer.invoke("autostart:get"),
  setAutoStart: (enabled) => ipcRenderer.invoke("autostart:set", enabled),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  onBalanceUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("balance:update", listener);
    return () => ipcRenderer.off("balance:update", listener);
  }
});
