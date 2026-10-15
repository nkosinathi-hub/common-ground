// Test setup for the attachments service: memory ports and three callers. Not deployed.
import { MemoryStorage, MemoryStore } from "./memory-fakes.ts"
import { IDEA, SAMPLES, SPACE, memoryGate } from "./samples.ts"
import { createAttachmentsService } from "./service.ts"

export const ana = { token: "ana-token", userId: "ana" }
export const bob = { token: "bob-token", userId: "bob" }
/** Signed in, but never a member of SPACE. */
export const eve = { token: "eve-token", userId: "eve" }

export const pdf = {
  spaceId: SPACE,
  ideaId: IDEA,
  filename: "plan.pdf",
  mime: "application/pdf",
  bytes: SAMPLES.pdf.length,
}

export function setup() {
  const store = new MemoryStore()
  const storage = new MemoryStorage()
  store.ideas.add(`${SPACE}/${IDEA}`)
  const service = createAttachmentsService({ gate: memoryGate(), store, storage })
  /** Starts an upload as ana and returns its pending row. */
  const started = async (input = pdf) => {
    const result = await service.start(ana, input)
    if (!result.ok) throw new Error(result.message)
    return store.rows.get(result.body.attachmentId)!
  }
  return { store, storage, service, started }
}
