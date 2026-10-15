import { describe, expect, it } from "vitest"
import { CURRENCIES, currencyOptions } from "./currency"

describe("currency options", () => {
  it("offers the common currencies, the idea's own first when it is not one of them", () => {
    expect(CURRENCIES[0]).toBe("ZAR")
    expect(currencyOptions("ZAR")).toEqual([...CURRENCIES])
    expect(currencyOptions("JPY")).toEqual(["JPY", ...CURRENCIES])
  })
})
