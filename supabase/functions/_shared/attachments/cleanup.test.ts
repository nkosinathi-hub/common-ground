import { describe, expect, it } from "vitest"
import { planCleanup, runCleanup } from "./cleanup.ts"
import { MemoryStorage, MemoryStore } from "./memory-fakes.ts"

const candidate = (n: number, withRow = true) => ({
  attachmentId: withRow ? `id-${n}` : null,
  objectPath: `s/i/${n}`,
})

describe("planCleanup", () => {
  it("batches candidates and only deletes rows that exist", () => {
    const batches = planCleanup([candidate(1), candidate(2, false), candidate(3)], 2)
    expect(batches).toEqual([
      { paths: ["s/i/1", "s/i/2"], attachmentIds: ["id-1"] },
      { paths: ["s/i/3"], attachmentIds: ["id-3"] },
    ])
  })

  it("removes each path once and handles an empty list", () => {
    expect(planCleanup([candidate(1), candidate(1)])).toHaveLength(1)
    expect(planCleanup([])).toEqual([])
  })
})

describe("runCleanup", () => {
  it("removes abandoned objects, then their rows", async () => {
    const store = new MemoryStore()
    const storage = new MemoryStorage()
    storage.objects.set("s/i/1", new Uint8Array(1))
    storage.objects.set("s/i/2", new Uint8Array(1))
    store.candidates = [candidate(1), candidate(2, false)]
    expect(await runCleanup(store, storage)).toEqual({
      removedObjects: 2,
      deletedRows: 1,
      failedBatches: 0,
    })
    expect(storage.objects.size).toBe(0)
    expect(store.deleted).toEqual(["id-1"])
  })

  it("keeps rows when object removal fails so the next run retries", async () => {
    const store = new MemoryStore()
    const storage = new MemoryStorage()
    storage.failRemove = true
    store.candidates = [candidate(1)]
    expect(await runCleanup(store, storage)).toEqual({
      removedObjects: 0,
      deletedRows: 0,
      failedBatches: 1,
    })
    expect(store.deleted).toEqual([])
  })
})
