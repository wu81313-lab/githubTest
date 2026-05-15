"use strict";

const balanceValue = document.querySelector("[data-balance-value]");
const balanceMeta = document.querySelector("[data-balance-meta]");
const statusDot = document.querySelector("[data-status-dot]");
const statusText = document.querySelector("[data-status-text]");
const sourceText = document.querySelector("[data-source]");
const refreshButton = document.querySelector("[data-refresh]");
const loginButton = document.querySelector("[data-login]");
const siteButton = document.querySelector("[data-site]");
const autostartToggle = document.querySelector("[data-autostart]");
const shell = document.querySelector("[data-shell]");

function formatTime(value) {
  if (!value) {
    return "尚未同步";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function updateState(state) {
  const hasBalance = Boolean(state.balance);

  balanceValue.textContent = hasBalance ? state.balance.display : "--";
  balanceMeta.textContent = `上次更新 ${formatTime(state.lastUpdatedAt)}`;
  statusText.textContent = state.message || "等待同步";
  sourceText.textContent = state.sourceUrl || "https://www.packyapi.com";

  shell.dataset.status = state.status;
  statusDot.dataset.status = state.status;
  refreshButton.disabled = state.status === "loading";
}

async function loadInitialState() {
  updateState(await window.packyBalance.getState());
  autostartToggle.checked = await window.packyBalance.getAutoStart();
}

refreshButton.addEventListener("click", async () => {
  updateState(await window.packyBalance.refresh());
});

loginButton.addEventListener("click", () => {
  window.packyBalance.openLogin();
});

siteButton.addEventListener("click", () => {
  window.packyBalance.openSite();
});

autostartToggle.addEventListener("change", async () => {
  autostartToggle.disabled = true;
  autostartToggle.checked = await window.packyBalance.setAutoStart(autostartToggle.checked);
  autostartToggle.disabled = false;
});

window.packyBalance.onBalanceUpdate(updateState);
loadInitialState();
