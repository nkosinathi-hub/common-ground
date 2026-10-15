import { describe, expect, it } from "vitest"
import { MAX_NOTE, recipientOptions, validateNote, validateRecipients } from "./recommendation"

const members = [
  { id: "me", displayName: "Nkosi" },
  { id: "z", displayName: "Zola" },
  { id: "a", displayName: "Anele" },
]

describe("recommendation rules", () => {
  it("treats a blank note as none and bounds its length", () => {
    expect(validateNote("  ")).toEqual({ ok: true, value: null })
    expect(validateNote(" Watch ep 3 ")).toEqual({ ok: true, value: "Watch ep 3" })
    expect(validateNote("n".repeat(MAX_NOTE)).ok).toBe(true)
    expect(validateNote("n".repeat(MAX_NOTE + 1))).toMatchObject({
      ok: false,
      error: { field: "note" },
    })
  })

  it("needs at least one recipient other than me, each once", () => {
    expect(validateRecipients(["z", "z", "a"], "me")).toEqual({ ok: true, value: ["z", "a"] })
    expect(validateRecipients(["me"], "me")).toMatchObject({
      ok: false,
      error: { field: "recipients" },
    })
    expect(validateRecipients([], "me").ok).toBe(false)
  })

  it("offers every other member by name", () => {
    expect(recipientOptions(members, "me").map((m) => m.id)).toEqual(["a", "z"])
  })
})
