import { describe, expect, it, vi } from "vitest"
import { CANCELLED_MESSAGE } from "../application/attachments-service"
import { FetchUploader } from "./fetch-uploader"

const UPLOAD_URL = "https://storage.test/upload/sign/attachments/a"
const SIZE = 10
const file = new File([new Uint8Array(SIZE)], "a.png", { type: "image/png" })
const put = (uploader: FetchUploader, signal?: AbortSignal) =>
  uploader.put({ url: UPLOAD_URL, file, mime: "image/png", signal })

describe("FetchUploader", () => {
  it("PUTs the body with its type and reports completion", async () => {
    const send = vi.fn(async () => new Response(null, { status: 200 }))
    const progress: number[] = []
    const result = await new FetchUploader(send).put({
      url: UPLOAD_URL,
      file,
      mime: "image/png",
      onProgress: (loaded) => progress.push(loaded),
    })
    expect(result.ok).toBe(true)
    expect(send).toHaveBeenCalledWith(
      UPLOAD_URL,
      expect.objectContaining({ method: "PUT", body: file }),
    )
    expect(progress).toEqual([0, SIZE])
  })

  it("explains a refusal of an oversized file", async () => {
    const tooBig = new FetchUploader(async () => new Response(null, { status: 413 }))
    expect(await put(tooBig)).toEqual({
      ok: false,
      error: { kind: "validation", message: "Files can be at most 10 MB" },
    })
  })

  it("reports an aborted PUT as cancelled, not as a network failure", async () => {
    const controller = new AbortController()
    const aborting = new FetchUploader(async () => {
      controller.abort()
      throw new DOMException("aborted", "AbortError")
    })
    expect(await put(aborting, controller.signal)).toMatchObject({
      error: { message: CANCELLED_MESSAGE },
    })
  })
})
