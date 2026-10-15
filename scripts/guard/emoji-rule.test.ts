import { describe, expect, it } from "vitest"
import { findEmoji } from "./emoji-rule"

describe("emoji rule", () => {
  it("reports lines with pictographs but allows plain symbols and accents", () => {
    const smile = String.fromCodePoint(0x1f600)
    const rocket = String.fromCodePoint(0x1f680)
    const text = `fine: café, R 100, (c) 2026\nbad ${smile}\nalso ${rocket} here`
    expect(findEmoji([{ path: "a.md", text }])).toEqual([
      { path: "a.md", line: 2 },
      { path: "a.md", line: 3 },
    ])
  })
})
