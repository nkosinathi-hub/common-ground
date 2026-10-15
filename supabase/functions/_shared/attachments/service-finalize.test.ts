import { describe, expect, it } from "vitest"
import { RATE_LIMITS } from "./ports.ts"
import { IDEA, SAMPLES } from "./samples.ts"
import { ana, bob, eve, pdf, setup } from "./service-fixture.ts"

describe("finalize", () => {
  it("marks a genuine upload ready, once", async () => {
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

  it("stops reading object bytes once the caller passes the hourly limit", async () => {
    const { service } = setup()
    for (let i = 0; i < RATE_LIMITS.finalize.max; i++) await service.finalize(bob, IDEA)
    expect(await service.finalize(bob, IDEA)).toMatchObject({ ok: false, kind: "rate_limited" })
  })
})
