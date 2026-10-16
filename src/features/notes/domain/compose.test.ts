import { describe, expect, it } from "vitest"
import { expiresAt, EXPIRY_CHOICES, recipientsFor } from "./compose"

describe("recipientsFor", () => {
  it("offers every member but the writer", () => {
    const members = [
      { id: "ana", displayName: "Ana" },
      { id: "ben", displayName: "Ben" },
    ]
    expect(recipientsFor(members, "ana")).toEqual([{ id: "ben", displayName: "Ben" }])
  })
})

describe("expiresAt", () => {
  const now = new Date("2026-10-16T09:00:00.000Z")

  it("never expires by default", () => {
    expect(expiresAt("never", now)).toBeNull()
  })

  it("counts whole days from now, well inside the 90-day limit", () => {
    expect(expiresAt("day", now)).toBe("2026-10-17T09:00:00.000Z")
    expect(expiresAt("month", now)).toBe("2026-11-15T09:00:00.000Z")
    expect(EXPIRY_CHOICES.map((choice) => choice.label)).toEqual([
      "Never",
      "In a day",
      "In a week",
      "In 30 days",
    ])
  })
})
