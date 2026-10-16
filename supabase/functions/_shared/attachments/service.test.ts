import { describe, expect, it } from "vitest"
import { DOWNLOAD_SECONDS, RATE_LIMITS } from "./ports.ts"
import { IDEA, SPACE } from "./samples.ts"
import { ana, bob, eve, pdf, setup } from "./service-fixture.ts"
import { BYTES_MAX } from "./types.ts"

describe("start", () => {
  it("creates a pending row and a signed upload URL for its derived path", async () => {
    const { store, service } = setup()
    const result = await service.start(ana, pdf)
    expect(result.ok && result.body.uploadUrl).toContain(`${SPACE}/${IDEA}/`)
    expect([...store.rows.values()]).toMatchObject([{ status: "pending", uploaderId: "ana" }])
  })

  it("refuses nonmembers, unknown ideas and bad intents", async () => {
    const { service } = setup()
    expect(await service.start(eve, pdf)).toMatchObject({ ok: false, status: 403 })
    expect(await service.start(ana, { ...pdf, ideaId: SPACE })).toMatchObject({ status: 404 })
    const tooBig = { ...pdf, bytes: BYTES_MAX + 1 }
    expect(await service.start(ana, tooBig)).toMatchObject({ status: 400 })
    expect(await service.start(ana, { ...pdf, filename: "x.exe" })).toMatchObject({ status: 400 })
  })

  it("refuses starts past the hourly limit", async () => {
    const { service } = setup()
    for (let i = 0; i < RATE_LIMITS.start.max; i++) await service.start(ana, pdf)
    expect(await service.start(ana, pdf)).toMatchObject({ ok: false, kind: "rate_limited" })
  })
})

describe("download", () => {
  it("signs a short-lived URL for members and refuses nonmembers", async () => {
    const { store, storage, service, started } = setup()
    const row = await started()
    expect(await service.download(bob, row.id, "inline")).toMatchObject({ status: 404 })
    store.rows.set(row.id, { ...row, status: "ready" })
    expect(await service.download(bob, row.id, "attachment")).toMatchObject({
      ok: true,
      body: { expiresIn: DOWNLOAD_SECONDS },
    })
    const signed = { path: row.objectPath, seconds: DOWNLOAD_SECONDS, downloadAs: "plan.pdf" }
    expect(storage.signed).toEqual([signed])
    expect(await service.download(eve, row.id, "inline")).toMatchObject({ status: 403 })
  })

  it("stops signing URLs once the caller passes the per-minute limit", async () => {
    const { service } = setup()
    for (let i = 0; i < RATE_LIMITS.download.max; i++) await service.download(bob, IDEA, "inline")
    expect(await service.download(bob, IDEA, "inline")).toMatchObject({ kind: "rate_limited" })
  })
})
