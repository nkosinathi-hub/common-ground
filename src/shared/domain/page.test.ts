import { describe, expect, it } from "vitest"
import { nextCursor } from "./page"

const row = (n: number) => ({ id: `id-${n}`, createdAt: `2026-10-15T00:00:0${n}Z` })

describe("nextCursor", () => {
  it("returns the last row of a full page", () => {
    expect(nextCursor([row(1), row(2)], 2)).toEqual({ id: "id-2", createdAt: row(2).createdAt })
  })

  it("returns null for a short or empty page", () => {
    expect(nextCursor([row(1)], 2)).toBeNull()
    expect(nextCursor([], 2)).toBeNull()
  })
})
