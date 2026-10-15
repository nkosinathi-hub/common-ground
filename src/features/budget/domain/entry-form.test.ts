import { describe, expect, it } from "vitest"
import { amountText, entryFormOf } from "./entry-form"

describe("entry form", () => {
  it("writes minor units as decimal text the parser reads back", () => {
    expect(amountText(150050)).toBe("1500.50")
    expect(amountText(7)).toBe("0.07")
    expect(amountText(0)).toBe("0.00")
  })

  it("starts an edit from the entry's current values", () => {
    const entry = {
      id: "e",
      ideaId: "i",
      category: "Rent",
      label: "Deposit",
      estimatedMinor: 100000,
      actualMinor: 0,
      createdAt: "",
      updatedAt: "",
    }
    expect(entryFormOf(entry)).toEqual({
      category: "Rent",
      label: "Deposit",
      estimated: "1000.00",
      actual: "0.00",
    })
  })
})
