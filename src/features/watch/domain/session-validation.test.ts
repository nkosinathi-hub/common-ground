import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { validateSession } from "./validation"

const today = "2026-10-15" as DateOnly
const fieldOf = (watchedOn: string, memberIds: string[], note = "") => {
  const r = validateSession({ watchedOn: watchedOn as DateOnly, memberIds, note }, today)
  return r.ok ? null : r.error.field
}

describe("session validation", () => {
  it("dedupes who was there and trims the note", () => {
    expect(
      validateSession({ watchedOn: today, memberIds: ["a", "a", "b"], note: " fun " }, today),
    ).toEqual({ ok: true, value: { watchedOn: today, memberIds: ["a", "b"], note: "fun" } })
  })

  it("needs someone present, a real day not in the future and a short note", () => {
    expect(fieldOf(today, [])).toBe("memberIds")
    expect(fieldOf("2026-10-20", ["a"])).toBe("watchedOn")
    expect(fieldOf("2026-02-30", ["a"])).toBe("watchedOn")
    expect(fieldOf(today, ["a"], "x".repeat(501))).toBe("note")
    expect(fieldOf("2026-10-14", ["a"])).toBeNull()
  })
})
