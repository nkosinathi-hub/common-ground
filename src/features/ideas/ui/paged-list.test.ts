import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { PagedList } from "./paged-list.svelte"

type Row = { id: string; createdAt: string; n: number }
const page =
  (items: Row[], next = null) =>
  async () =>
    ok({ items, next })

describe("PagedList", () => {
  it("loads, adds, replaces and removes", async () => {
    const list = new PagedList<Row>(page([{ id: "a", createdAt: "", n: 1 }]))
    await list.load()
    expect(list.loading).toBe(false)
    await list.add(Promise.resolve(ok({ id: "b", createdAt: "", n: 2 })))
    await list.replace(Promise.resolve(ok({ id: "a", createdAt: "", n: 9 })))
    expect(list.items.map((r) => `${r.id}${r.n}`)).toEqual(["b2", "a9"])
    await list.remove("b", Promise.resolve(ok(undefined)))
    expect(list.items.map((r) => r.id)).toEqual(["a"])
  })

  it("returns write errors and keeps load errors", async () => {
    const list = new PagedList<Row>(async () => err(appError("denied", "no")))
    await list.load(true)
    expect(list.error?.kind).toBe("denied")
    const failure = await list.add(Promise.resolve(err(appError("validation", "bad"))))
    expect(failure?.kind).toBe("validation")
  })
})
