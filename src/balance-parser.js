"use strict";

const MONEY_RE = /([$￥¥])\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/;

function parseMoney(value) {
  const match = value.match(MONEY_RE);
  if (!match) {
    return null;
  }

  const displayAmount = match[2].replace(/,/g, "");

  return {
    amount: Number(displayAmount),
    currency: match[1],
    display: `${match[1]}${displayAmount}`
  };
}

function findNearbyMoney(lines, labelIndex, direction) {
  const offsets = direction === "before" ? [-1, -2, -3] : [1, 2, 3];

  for (const offset of offsets) {
    const line = lines[labelIndex + offset];
    if (!line) {
      continue;
    }

    const money = parseMoney(line);
    if (money) {
      return money;
    }
  }

  return null;
}

function parseBalanceText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return null;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const labelIndex = lines.findIndex((line) => line.includes("当前余额"));
  if (labelIndex === -1) {
    return null;
  }

  return (
    findNearbyMoney(lines, labelIndex, "before") ||
    findNearbyMoney(lines, labelIndex, "after")
  );
}

module.exports = {
  parseBalanceText
};
