import { afterEach, describe, expect, it, vi } from "vitest"
import { ok, err, appError } from "@/shared/domain"
import { SearchService, type SearchGateway } from "../application/search-service"
import type { SearchHit } from "../domain/search"
import { SearchState } from "./search-state.svelte"
const hit = (id: string): SearchHit => ({
  id,
  kind: "watch",
  title: id,
  preview: "",
  route: { name: "watch-item", spaceId: "s", itemId: id },
})
const page = (ids: string[], more = false) => ok({ hits: ids.map(hit), unavailable: [], more })
afterEach(() => vi.useRealTimers())

describe("universal search state", () => {
  it("debounces, ignores stale replies and clears immediately", async () => {
    vi.useFakeTimers()
    let release!: (value: ReturnType<typeof page>) => void
    const search = vi
      .fn<SearchGateway["search"]>()
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            release = done
          }),
      )
      .mockResolvedValueOnce(page(["Arrival"]))
    const state = new SearchState(new SearchService({ search }), () => "s")
    state.input("Ted")
    await vi.advanceTimersByTimeAsync(249)
    expect(search).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    const signal = search.mock.calls[0]![3]
    state.input("Arrival")
    expect(signal.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(250)
    release(page(["Ted"]))
    await Promise.resolve()
    expect(state.hits.map((h) => h.title)).toEqual(["Arrival"])
    state.input("")
    expect(state.hits).toEqual([])
    expect(state.loading).toBe(false)
    state.dispose()
  })
  it("deduplicates more pages and retries without changing the query", async () => {
    const search = vi
      .fn<SearchGateway["search"]>()
      .mockResolvedValueOnce(page(["B", "A"], true))
      .mockResolvedValueOnce(page(["B", "C"]))
      .mockResolvedValueOnce(err(appError("network", "offline")))
      .mockResolvedValueOnce(page(["A"]))
    const state = new SearchState(new SearchService({ search }), () => "s")
    state.input("aa")
    await state.load()
    await state.load(true)
    expect(state.hits.map((h) => h.id)).toEqual(["A", "B", "C"])
    await state.load()
    expect(state.error?.kind).toBe("network")
    await state.load()
    expect(state.error).toBeNull()
    expect(state.query).toBe("aa")
    state.dispose()
  })
})
