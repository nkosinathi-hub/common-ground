import { describe, expect, it } from "vitest"
import { addMoney, formatMoney, isCurrencyCode, money, parseMoney, subtractMoney } from "./money"

describe("Money", () => {
  it("parses decimal input into integer minor units", () => {
    expect(parseMoney("1234.5", "ZAR")).toEqual({ ok: true, value: money(123450, "ZAR") })
    expect(parseMoney("0.07", "ZAR")).toEqual({ ok: true, value: money(7, "ZAR") })
    expect(parseMoney("1 000,25", "ZAR")).toEqual({ ok: true, value: money(100025, "ZAR") })
  })

  it("rejects negative, malformed and over-precise amounts", () => {
    for (const bad of ["-1", "abc", "1.234", "", "1e5"]) {
      expect(parseMoney(bad, "ZAR").ok).toBe(false)
    }
  })

  it("adds and subtracts without floating point drift", () => {
    const a = money(10, "ZAR")
    const b = money(20, "ZAR")
    expect(addMoney(a, b)).toEqual(money(30, "ZAR"))
    expect(subtractMoney(a, b)).toEqual(money(-10, "ZAR"))
  })

  it("refuses to combine currencies", () => {
    expect(() => addMoney(money(1, "ZAR"), money(1, "USD"))).toThrow(/currency/)
  })

  it("formats for display", () => {
    expect(formatMoney(money(123450, "ZAR"), "en-ZA")).toMatch(/1.234,50|1 234,50/)
  })

  it("validates ISO currency codes", () => {
    expect(isCurrencyCode("ZAR")).toBe(true)
    expect(isCurrencyCode("zar")).toBe(false)
  })
})
