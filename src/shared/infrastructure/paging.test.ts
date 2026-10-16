import { describe, expect, it } from "vitest"
import { PAGE_SIZE } from "@/shared/domain"
import { newestFirst, olderThan, pageOf } from "./paging"
import { recordingClient } from "./testing/recording-client"

interface Query {
  or(filters: string): Query
  order(column: "created_at" | "id", options: { ascending: boolean }): Query
  limit(count: number): Query
}

const CURSOR = { createdAt: "2026-10-15T10:00:00+00:00", id: "b" }
const ORDERED = [
  ["order", "created_at", { ascending: false }],
  ["order", "id", { ascending: false }],
  ["limit", PAGE_SIZE],
]

describe("olderThan", () => {
  it("pages strictly after the cursor on ties, quoting the timestamp", () => {
    expect(olderThan(CURSOR)).toBe(
      'created_at.lt."2026-10-15T10:00:00+00:00",and(created_at.eq."2026-10-15T10:00:00+00:00",id.lt.b)',
    )
  })
})

describe("newestFirst", () => {
  it("orders the first page newest first on (created_at, id), one page long", () => {
    const { calls, client } = recordingClient({ data: [], error: null })
    newestFirst(client as Query, null)
    expect(calls).toEqual(ORDERED)
  })

  it("continues strictly after the cursor", () => {
    const { calls, client } = recordingClient({ data: [], error: null })
    newestFirst(client as Query, CURSOR)
    expect(calls).toEqual([["or", olderThan(CURSOR)], ...ORDERED])
  })
})

describe("pageOf", () => {
  const toItem = (row: { n: number }) => ({ id: `id-${row.n}`, createdAt: `t${row.n}` })
  const rows = (count: number) => Array.from({ length: count }, (_, n) => ({ n }))

  it("maps the rows; a full page ends on the cursor for the next one", () => {
    const page = pageOf(toItem)(rows(PAGE_SIZE))
    expect(page.items).toHaveLength(PAGE_SIZE)
    expect(page.next).toEqual({ id: `id-${PAGE_SIZE - 1}`, createdAt: `t${PAGE_SIZE - 1}` })
  })

  it("has no next page after a short one", () => {
    expect(pageOf(toItem)(rows(2))).toEqual({
      items: [toItem({ n: 0 }), toItem({ n: 1 })],
      next: null,
    })
  })
})
