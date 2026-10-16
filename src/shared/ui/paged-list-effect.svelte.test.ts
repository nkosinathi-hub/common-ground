import { flushSync } from "svelte"
import { describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import { PagedList } from "./paged-list.svelte"

describe("PagedList inside an effect", () => {
  it("does not make the effect depend on what the loader reads", async () => {
    const source = $state({ id: "a" })
    let loads = 0
    const list = new PagedList<{ id: string }, null>(async () => {
      loads += 1
      return ok({ items: [{ id: source.id }], next: null })
    })
    const stop = $effect.root(() => {
      $effect(() => {
        void list.load()
      })
    })
    flushSync()
    source.id = "b"
    flushSync()
    stop()
    expect(loads).toBe(1)
  })
})
