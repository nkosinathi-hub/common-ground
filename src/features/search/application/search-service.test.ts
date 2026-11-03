import { describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import { ranked, type SearchHit } from "../domain/search"
import { SearchService } from "./search-service"

describe("search service", () => {
  it("rejects invalid queries and pages before calling the gateway", async () => {
    const search = vi.fn(),
      service = new SearchService({ search }),
      signal = new AbortController().signal
    for (const [space, query, page] of [
      ["s", "a", 0],
      ["s", "a".repeat(161), 0],
      ["", "aa", 0],
      ["s", "aa", -1],
    ] as const)
      expect(await service.search(space, query, page, signal)).toMatchObject({ ok: false })
    expect(search).not.toHaveBeenCalled()
  })
  it("adds navigation hits only to the first page", async () => {
    const search = vi.fn().mockResolvedValue(ok({ hits: [], unavailable: [], more: false }))
    const service = new SearchService({ search }),
      signal = new AbortController().signal
    expect(await service.search("s", " notes ", 0, signal)).toMatchObject({
      ok: true,
      value: { hits: [{ kind: "page", route: { name: "notes", spaceId: "s" } }] },
    })
    expect(search).toHaveBeenCalledWith("s", "notes", 0, signal)
    expect(await service.search("s", "notes", 1, signal)).toMatchObject({
      ok: true,
      value: { hits: [] },
    })
  })
  it("ranks exact title matches before prefixes, then other matches", () => {
    const hits = ["Other Ted", "Ted Lasso", "Ted"].map((title) => ({ title }) as SearchHit)
    expect(ranked(hits, "ted").map((h) => h.title)).toEqual(["Ted", "Ted Lasso", "Other Ted"])
  })
})
