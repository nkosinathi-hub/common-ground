import { describe, expect, it } from "vitest"
import {
  editedAgo,
  filledSections,
  insertWord,
  SECTION_MAX,
  showCounter,
  validateHardTalk,
} from "./hard-talk"

describe("filledSections", () => {
  it("keeps only parts with words, in the writing order", () => {
    const sections = { help: "A hug", feel: "  ", happened: " Sunday " }
    expect(filledSections(sections)).toEqual([
      ["happened", "Sunday"],
      ["help", "A hug"],
    ])
  })
})

describe("validateHardTalk", () => {
  it("needs someone to send to and words in at least one part", () => {
    expect(validateHardTalk({ feel: "sad" }, "ben")).toEqual({ ok: true, value: { feel: "sad" } })
    expect(validateHardTalk({ feel: "sad" }, "")).toMatchObject({
      ok: false,
      error: { field: "to", message: "Choose who this is for" },
    })
    expect(validateHardTalk({ feel: " " }, "ben")).toMatchObject({
      ok: false,
      error: { field: "sections", message: "Write something in at least one part" },
    })
  })

  it("keeps each part within 500 characters", () => {
    const long = { matters: "x".repeat(SECTION_MAX + 1) }
    expect(validateHardTalk(long, "ben")).toMatchObject({ ok: false, error: { field: "matters" } })
  })
})

describe("showCounter", () => {
  it("shows the counter only past 400 characters", () => {
    expect(showCounter("x".repeat(400))).toBe(false)
    expect(showCounter("x".repeat(401))).toBe(true)
  })
})

describe("insertWord", () => {
  it("puts the word at the cursor, spaced, and moves the cursor after it", () => {
    expect(insertWord("", "hurt", 0)).toEqual({ text: "hurt", cursor: 4 })
    expect(insertWord("I feel", "sad", 6)).toEqual({ text: "I feel sad", cursor: 10 })
    expect(insertWord("I feel and tired", "sad", 7)).toEqual({
      text: "I feel sad and tired",
      cursor: 10,
    })
    expect(insertWord("I feel ", "torn", 7)).toEqual({ text: "I feel torn", cursor: 11 })
  })

  it("never grows past the part's limit", () => {
    const full = "x".repeat(SECTION_MAX - 2)
    expect(insertWord(full, "lonely", full.length).text).toBe(full)
  })
})

describe("editedAgo", () => {
  const now = new Date("2026-10-16T12:00:00Z")
  it("reads in the shortest plain words", () => {
    expect(editedAgo("2026-10-16T11:59:40Z", now)).toBe("just now")
    expect(editedAgo("2026-10-16T11:55:00Z", now)).toBe("5m ago")
    expect(editedAgo("2026-10-16T10:00:00Z", now)).toBe("2h ago")
    expect(editedAgo("2026-10-13T12:00:00Z", now)).toBe("3d ago")
  })
})
