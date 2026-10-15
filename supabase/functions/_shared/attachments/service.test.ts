import { describe, expect, it } from "vitest"
import { MemoryStorage, MemoryStore } from "./memory-fakes.ts"
import { RATE_LIMIT } from "./ports.ts"
import { IDEA, SAMPLES, SPACE, memoryGate } from "./samples.ts"
import { createAttachmentsService } from "./service.ts"

const ana = { token: "ana-token", userId: "ana" }
const bob = { token: "bob-token", userId: "bob" }
const eve = { token: "eve-token", userId: "eve" }
const pdf = {
  spaceId: SPACE,
  ideaId: IDEA,
  filename: "plan.pdf",
  mime: "application/pdf",
  bytes: 9,
}

function setup() {
  const store = new MemoryStore()
  const storage = new MemoryStorage()
  store.ideas.add(`${SPACE}/${IDEA}`)
  const service = createAttachmentsService({ gate: memoryGate(), store, storage })
  const started = async (input = pdf) => {
    const result = await service.start(ana, input)
    if (!result.ok) throw new Error(result.message)
    return store.rows.get(result.body.attachmentId)!
  }
  return { store, storage, service, started }
}

describe("start", () => {
  it("creates a pending row and a signed upload URL for its derived path", async () => {
    const { store, service } = setup()
    const result = await service.start(ana, pdf)
    expect(result.ok && result.body.uploadUrl).toContain(`${SPACE}/${IDEA}/`)
    expect([...store.rows.values()]).toMatchObject([{ status: "pending", uploaderId: "ana" }])
  })

  it("refuses nonmembers, unknown ideas, bad intents and the 21st start in an hour", async () => {
    const { service } = setup()
    expect(await service.start(eve, pdf)).toMatchObject({ ok: false, status: 403 })
    expect(await service.start(ana, { ...pdf, ideaId: SPACE })).toMatchObject({ status: 404 })
    expect(await service.start(ana, { ...pdf, bytes: 11 * 1024 * 1024 })).toMatchObject({
      status: 400,
    })
    expect(await service.start(ana, { ...pdf, filename: "x.exe" })).toMatchObject({ status: 400 })
    for (let i = 1; i < RATE_LIMIT.max; i++) expect((await service.start(ana, pdf)).ok).toBe(true)
    expect(await service.start(ana, pdf)).toMatchObject({ ok: false, kind: "rate_limited" })
  })
})

describe("finalize", () => {
  it("marks a genuine upload ready", async () => {
    const { storage, service, started } = setup()
    const row = await started()
    storage.objects.set(row.objectPath, SAMPLES.pdf)
    const result = await service.finalize(ana, row.id)
    expect(result).toMatchObject({ ok: true, body: { id: row.id, mime: "application/pdf" } })
    expect(await service.finalize(ana, row.id)).toMatchObject({ status: 404 })
  })

  it("rejects and deletes a spoofed file", async () => {
    const { store, storage, service, started } = setup()
    const row = await started({ ...pdf, bytes: SAMPLES.png.length })
    storage.objects.set(row.objectPath, SAMPLES.png)
    expect(await service.finalize(ana, row.id)).toMatchObject({ ok: false, status: 400 })
    expect(storage.removed).toEqual([row.objectPath])
    expect(store.rows.get(row.id)?.status).toBe("rejected")
  })

  it("only lets the uploader finalize, while still a member", async () => {
    const { store, service, started } = setup()
    const row = await started()
    expect(await service.finalize(bob, row.id)).toMatchObject({ status: 404 })
    store.rows.set(row.id, { ...row, uploaderId: "eve" })
    expect(await service.finalize(eve, row.id)).toMatchObject({ status: 403 })
  })
})

describe("download", () => {
  it("signs a 60 second URL for members and refuses nonmembers", async () => {
    const { store, storage, service, started } = setup()
    const row = await started()
    expect(await service.download(bob, row.id, "inline")).toMatchObject({ status: 404 })
    store.rows.set(row.id, { ...row, status: "ready" })
    expect(await service.download(bob, row.id, "attachment")).toMatchObject({
      ok: true,
      body: { expiresIn: 60 },
    })
    expect(storage.signed).toEqual([{ path: row.objectPath, seconds: 60, downloadAs: "plan.pdf" }])
    expect(await service.download(eve, row.id, "inline")).toMatchObject({ status: 403 })
  })
})
