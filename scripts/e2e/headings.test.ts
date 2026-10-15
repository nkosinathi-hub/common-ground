import { describe, expect, it } from "vitest"
import { headingProblems } from "../../tests/e2e/support/headings"

describe("heading order", () => {
  it("accepts one h1 followed by levels that step down one at a time", () => {
    expect(headingProblems([1, 2, 3, 2, 2, 3])).toEqual([])
  })

  it("requires exactly one h1, and it must come first", () => {
    expect(headingProblems([])).toEqual(["expected exactly one h1, found 0"])
    expect(headingProblems([1, 2, 1])).toEqual(["expected exactly one h1, found 2"])
    expect(headingProblems([2, 1])).toEqual(["first heading is h2, expected h1"])
  })

  it("flags skipped levels", () => {
    expect(headingProblems([1, 3])).toEqual(["h3 follows h1 (skips a level)"])
  })
})
