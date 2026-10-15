import { describe, expect, it } from "vitest"
import { findEmDashes } from "./em-dash-rule"

describe("em dash rule", () => {
  it("reports each line containing an em dash", () => {
    const text = `fine - hyphen\nbad ${String.fromCharCode(0x2014)} dash\nen - dash ok`
    expect(findEmDashes([{ path: "a.md", text }])).toEqual([{ path: "a.md", line: 2 }])
  })
})
