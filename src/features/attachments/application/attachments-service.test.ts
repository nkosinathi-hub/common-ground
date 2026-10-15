import { describe, expect, it } from "vitest"
import type { UploadProgress } from "../domain/types"
import {
  FakeAttachmentsGateway,
  FakeUploader,
  IDEA_ID,
  SPACE_ID,
  attachment,
} from "../testing/fake-attachments"
import { AttachmentsService, CANCELLED_MESSAGE } from "./attachments-service"

const SIZE = 100
const HALF = SIZE / 2
const png = () => new File([new Uint8Array(SIZE)], " photo.png ", { type: "image/png" })
const target = { spaceId: SPACE_ID, ideaId: IDEA_ID }

function setup() {
  const gateway = new FakeAttachmentsGateway()
  const uploader = new FakeUploader()
  return { gateway, uploader, service: new AttachmentsService(gateway, uploader) }
}

describe("AttachmentsService.upload", () => {
  it("starts, uploads with progress, then finalizes", async () => {
    const { gateway, uploader, service } = setup()
    const progress: UploadProgress[] = []
    const onProgress = (p: UploadProgress) => progress.push(p)
    const result = await service.upload({ ...target, file: png(), onProgress })
    expect(result).toMatchObject({ ok: true, value: { id: "upload-1", filename: "photo.png" } })
    expect(gateway.started).toEqual([
      { ...target, filename: "photo.png", mime: "image/png", bytes: SIZE },
    ])
    expect(uploader.puts).toEqual([
      { url: "https://storage.test/upload-1", mime: "image/png", size: SIZE },
    ])
    expect(progress.map((p) => `${p.phase}:${p.loaded}`)).toEqual([
      "starting:0",
      "uploading:0",
      `uploading:${HALF}`,
      `uploading:${SIZE}`,
      `verifying:${SIZE}`,
    ])
  })

  it("prechecks before asking the server", async () => {
    const { gateway, service } = setup()
    const gif = new File(["GIF89a"], "a.gif", { type: "image/gif" })
    expect((await service.upload({ ...target, file: gif })).ok).toBe(false)
    expect(gateway.started).toEqual([])
  })

  it("passes server refusals through", async () => {
    const { gateway, uploader, service } = setup()
    const upload = () => service.upload({ ...target, file: png() })
    gateway.failStart = { kind: "rate_limited", message: "Pause" }
    expect(await upload()).toEqual({ ok: false, error: { kind: "rate_limited", message: "Pause" } })
    gateway.failStart = null
    uploader.failWith = { kind: "network", message: "Offline" }
    expect(await upload()).toMatchObject({ error: { message: "Offline" } })
    uploader.failWith = null
    gateway.failFinalize = { kind: "validation", message: "Not a real PNG" }
    expect(await upload()).toMatchObject({ error: { message: "Not a real PNG" } })
  })

  it("cancels through the AbortSignal, before or during the PUT", async () => {
    const { uploader, service } = setup()
    const before = new AbortController()
    before.abort()
    const early = await service.upload({ ...target, file: png(), signal: before.signal })
    expect(early).toMatchObject({ ok: false, error: { message: CANCELLED_MESSAGE } })
    expect(uploader.puts).toHaveLength(0)

    uploader.autoFinish = false
    const during = new AbortController()
    const pending = service.upload({ ...target, file: png(), signal: during.signal })
    await new Promise((resolve) => setTimeout(resolve, 0))
    during.abort()
    expect(await pending).toMatchObject({ ok: false, error: { message: CANCELLED_MESSAGE } })
  })
})

describe("AttachmentsService reads and deletes", () => {
  it("lists, signs URLs and removes", async () => {
    const { gateway, service } = setup()
    gateway.items = [attachment("a"), attachment("b", { ideaId: "other" })]
    expect(await service.list(SPACE_ID, IDEA_ID)).toMatchObject({ ok: true, value: [{ id: "a" }] })
    expect(await service.signedUrl("a")).toMatchObject({ ok: true })
    await service.signedUrl("a", "attachment")
    expect(gateway.urls.map((u) => u.disposition)).toEqual(["inline", "attachment"])
    expect(await service.remove("a")).toEqual({ ok: true, value: undefined })
    expect(gateway.removed).toEqual(["a"])
  })

  it("never hands out a signed URL that is not http(s)", async () => {
    const { gateway, service } = setup()
    gateway.signedBase = "javascript:alert(1)//"
    expect(await service.signedUrl("a")).toMatchObject({ ok: false, error: { kind: "unknown" } })
  })
})
