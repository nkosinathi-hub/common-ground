import { describe, expect, it } from "vitest"
import { reminderLabel, REMINDER_OPTIONS } from "./labels"

describe("reminder labels", () => {
  it("names every offered minute count", () => {
    expect([0, 10, 60, 120, 1440, 2880, 10080, 30].map(reminderLabel)).toEqual([
      "At the start",
      "10 minutes before",
      "1 hour before",
      "2 hours before",
      "1 day before",
      "2 days before",
      "1 week before",
      "30 minutes before",
    ])
    expect(REMINDER_OPTIONS.map((o) => o.value)).toEqual(["none", "0", "10", "60", "1440"])
  })
})
