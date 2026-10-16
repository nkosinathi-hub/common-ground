import { describe, expect, it } from "vitest"
import { runMediaCleanup, type MediaBucket, type MediaCandidates } from "./cleanup-media.ts"

function fakes(paths: string[], failOn: string | null = null) {
  const removed: string[][] = []
  const candidates: MediaCandidates = { list: async () => paths }
  const bucket: MediaBucket = {
    async remove(batch) {
      if (failOn && batch.includes(failOn)) throw new Error("storage down")
      removed.push([...batch])
    },
  }
  return { candidates, bucket, removed }
}

describe("runMediaCleanup", () => {
  it("removes orphaned space pictures in batches, each path once", async () => {
    const { candidates, bucket, removed } = fakes([
      "s/avatar/1.webp",
      "s/cover/2.webp",
      "s/avatar/1.webp",
    ])
    expect(await runMediaCleanup(candidates, bucket, 1)).toEqual({
      removedObjects: 2,
      failedBatches: 0,
    })
    expect(removed).toEqual([["s/avatar/1.webp"], ["s/cover/2.webp"]])
  })

  it("counts a failed batch and carries on with the rest", async () => {
    const { candidates, bucket, removed } = fakes(["a", "b"], "a")
    expect(await runMediaCleanup(candidates, bucket, 1)).toEqual({
      removedObjects: 1,
      failedBatches: 1,
    })
    expect(removed).toEqual([["b"]])
  })

  it("does nothing when there is nothing to clean", async () => {
    const { candidates, bucket, removed } = fakes([])
    expect(await runMediaCleanup(candidates, bucket)).toEqual({
      removedObjects: 0,
      failedBatches: 0,
    })
    expect(removed).toEqual([])
  })
})
