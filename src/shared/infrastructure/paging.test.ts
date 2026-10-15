import { describe, expect, it } from "vitest"
import { olderThan } from "./paging"

describe("olderThan", () => {
  it("pages strictly after the cursor on ties, quoting the timestamp", () => {
    expect(olderThan({ createdAt: "2026-10-15T10:00:00+00:00", id: "b" })).toBe(
      'created_at.lt."2026-10-15T10:00:00+00:00",and(created_at.eq."2026-10-15T10:00:00+00:00",id.lt.b)',
    )
  })
})
