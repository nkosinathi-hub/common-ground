import { describe, expect, it } from "vitest"
import { createAttachmentsHandler, type HandlerDeps } from "./handler.ts"
import { MemoryStorage, MemoryStore } from "./memory-fakes.ts"
import { memoryGate } from "./samples.ts"

const SECRET = "c".repeat(48)

function cleanupCall(media?: HandlerDeps["media"]) {
  const store = new MemoryStore()
  store.candidates = [{ attachmentId: null, objectPath: "s/i/u" }]
  const deps = {
    allowedOrigins: [],
    cleanupSecret: SECRET,
    gate: memoryGate(),
    store,
    storage: new MemoryStorage(),
    media,
  }
  const body = JSON.stringify({ action: "cleanup" })
  const headers = { "x-cleanup-secret": SECRET }
  return createAttachmentsHandler(deps)(
    new Request("http://fn.test/attachments", { method: "POST", headers, body }),
  )
}

describe("attachments cleanup with the space-media pass", () => {
  it("also removes orphaned space pictures when the pass is wired", async () => {
    const removed: string[] = []
    const media = {
      candidates: { list: async () => ["s/cover/old.webp"] },
      bucket: { remove: async (paths: readonly string[]) => void removed.push(...paths) },
    }
    const response = await cleanupCall(media)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      removedObjects: 1,
      deletedRows: 0,
      failedBatches: 0,
      media: { removedObjects: 1, failedBatches: 0 },
    })
    expect(removed).toEqual(["s/cover/old.webp"])
  })

  it("reports attachments alone until the pass is wired", async () => {
    expect(await (await cleanupCall()).json()).toEqual({
      removedObjects: 1,
      deletedRows: 0,
      failedBatches: 0,
    })
  })
})
