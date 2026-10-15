import { describe, expect, it } from "vitest"
import { item } from "../testing/fixtures"
import {
  DEFAULT_FILTERS,
  compareFor,
  hasActiveFilters,
  isAfter,
  matches,
  pageOf,
  sortKeyOf,
} from "./filters"

const dune = item(1, "Dune", { mediaType: "movie", intent: "watch_together", myStatus: "watching" })
const frieren = item(2, "Frieren", { mediaType: "anime", intent: "want_to_watch" })

describe("watch filters", () => {
  it("matches every title by default", () => {
    expect([dune, frieren].filter((i) => matches(i, DEFAULT_FILTERS))).toHaveLength(2)
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
  })

  it("filters by type, intent, my status and case-insensitive search", () => {
    const by = (f: Partial<typeof DEFAULT_FILTERS>) =>
      [dune, frieren].filter((i) => matches(i, { ...DEFAULT_FILTERS, ...f })).map((i) => i.title)
    expect(by({ mediaType: "anime" })).toEqual(["Frieren"])
    expect(by({ intent: "watch_together" })).toEqual(["Dune"])
    expect(by({ myStatus: "not_started" })).toEqual(["Frieren"])
    expect(by({ search: "  fRIE " })).toEqual(["Frieren"])
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: " x" })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "title" })).toBe(false)
  })

  it("sorts recent first, or by title then id", () => {
    const older = item(3, "Arrival", { createdAt: "2026-01-01T00:00:00Z" })
    const recent = [older, dune, frieren].sort(compareFor("recent")).map((i) => i.title)
    expect(recent).toEqual(["Frieren", "Dune", "Arrival"])
    const titles = [frieren, older, dune].sort(compareFor("title")).map((i) => i.title)
    expect(titles).toEqual(["Arrival", "Dune", "Frieren"])
    const twin = item(9, "dune")
    expect([twin, dune].sort(compareFor("title")).map((i) => i.id)).toEqual([dune.id, twin.id])
  })

  it("continues strictly after a keyset cursor", () => {
    expect(sortKeyOf(dune, "title")).toBe("dune")
    expect(sortKeyOf(dune, "recent")).toBe(dune.createdAt)
    const cursor = { key: "dune", id: dune.id }
    expect(isAfter(frieren, cursor, "title")).toBe(true)
    expect(isAfter(dune, cursor, "title")).toBe(false)
    const recentCursor = { key: frieren.createdAt, id: frieren.id }
    expect(isAfter(dune, recentCursor, "recent")).toBe(true)
    expect(isAfter(frieren, recentCursor, "recent")).toBe(false)
  })

  it("builds a page whose cursor is the last row of a full page", () => {
    const rows = [
      { item: dune, sortKey: "k1" },
      { item: frieren, sortKey: "k2" },
    ]
    expect(pageOf(rows, 2)).toEqual({ items: [dune, frieren], next: { key: "k2", id: frieren.id } })
    expect(pageOf(rows, 3).next).toBeNull()
    expect(pageOf([], 2)).toEqual({ items: [], next: null })
  })
})
