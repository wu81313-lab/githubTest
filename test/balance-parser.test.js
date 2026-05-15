import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { parseBalanceText } = require("../src/balance-parser");

describe("parseBalanceText", () => {
  test("reads the current balance when the amount is before the label", () => {
    const text = [
      "wuruiduo",
      "普通用户",
      "ID: 130932",
      "$28.01",
      "当前余额",
      "历史消耗",
      "$72.99"
    ].join("\n");

    expect(parseBalanceText(text)).toEqual({
      amount: 28.01,
      currency: "$",
      display: "$28.01"
    });
  });

  test("reads the current balance when the amount is after the label", () => {
    const text = [
      "钱包管理",
      "多种充值方式，安全便捷",
      "当前余额",
      "$29.14"
    ].join("\n");

    expect(parseBalanceText(text)).toEqual({
      amount: 29.14,
      currency: "$",
      display: "$29.14"
    });
  });

  test("returns null when no current balance amount is nearby", () => {
    const text = [
      "历史消耗",
      "$72.99",
      "请求次数",
      "1429"
    ].join("\n");

    expect(parseBalanceText(text)).toBeNull();
  });
});
