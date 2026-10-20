import { describe, expect, it } from "vitest"
import { appError, err, ok, type Result } from "@/shared/domain"
import { PagedList, type PageOf } from "./paged-list.svelte"

type Row = { id: string; n: number }
const rows = (...ids: string[]) => ids.map((id) => ({ id, n: 1 }))

describe("shared PagedList", () => {
  it("loads, pages and applies accepted writes", async () => {
    const pages: Record<string, PageOf<Row, string>> = {
      first: { items: rows("a", "b"), next: "b" },
      b: { items: rows("c"), next: null },
    }
    const list = new PagedList<Row, string>(async (after) => ok(pages[after ?? "first"]!))
    await list.load()
    expect(list.hasMore).toBe(true)
    await list.loadMore()
    expect(list.items.map((r) => r.id)).toEqual(["a", "b", "c"])
    expect(list.hasMore).toBe(false)
    await list.add(Promise.resolve(ok({ id: "z", n: 2 })))
    await list.replace(Promise.resolve(ok({ id: "a", n: 9 })))
    await list.remove("b", Promise.resolve(ok(undefined)))
    expect(list.items.map((r) => `${r.id}${r.n}`)).toEqual(["z2", "a9", "c1"])
  })

  it("keeps the list on failed writes and reports load errors", async () => {
    const list = new PagedList<Row>(async () => err(appError("network", "down")))
    await list.load()
    expect(list.error?.kind).toBe("network")
    expect(await list.add(Promise.resolve(err(appError("denied", "no"))))).toMatchObject({
      kind: "denied",
    })
    expect(list.items).toEqual([])
  })

  it("ignores a response that a newer load superseded", async () => {
    const waiting: ((value: Result<PageOf<Row, null>>) => void)[] = []
    const list = new PagedList<Row, null>(() => new Promise((resolve) => waiting.push(resolve)))
    const first = list.load()
    const second = list.load()
    waiting[1]!(ok({ items: rows("new"), next: null }))
    waiting[0]!(ok({ items: rows("old"), next: null }))
    await Promise.all([first, second])
    expect(list.items.map((r) => r.id)).toEqual(["new"])
  })

  it("ends in an error, not loading, when the loader throws", async () => {
    const list = new PagedList<Row, string>(() => Promise.reject(new Error("mapper bug")))
    await list.load()
    expect(list.loading).toBe(false)
    expect(list.error?.kind).toBe("unknown")
  })
})
