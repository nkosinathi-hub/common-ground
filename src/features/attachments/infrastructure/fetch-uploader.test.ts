import { describe, expect, it, vi } from "vitest"
import { FetchUploader } from "./fetch-uploader"

describe("FetchUploader", () => {
  const file = new File([new Uint8Array(10)], "a.png", { type: "image/png" })

  it("PUTs the body with its type and reports completion", async () => {
    const send = vi.fn(async () => new Response(null, { status: 200 }))
    const progress: number[] = []
    const result = await new FetchUploader(send).put("https://u", file, "image/png", {
      onProgress: (loaded) => progress.push(loaded),
    })
    expect(result.ok).toBe(true)
    expect(send).toHaveBeenCalledWith(
      "https://u",
      expect.objectContaining({ method: "PUT", body: file }),
    )
    expect(progress).toEqual([0, 10])
  })

  it("maps refusals and cancellation", async () => {
    const tooBig = new FetchUploader(async () => new Response(null, { status: 413 }))
    expect(await tooBig.put("u", file, "image/png", {})).toMatchObject({ ok: false })
    const controller = new AbortController()
    const aborting = new FetchUploader(async () => {
      controller.abort()
      throw new DOMException("aborted", "AbortError")
    })
    expect(await aborting.put("u", file, "image/png", { signal: controller.signal })).toMatchObject(
      {
        error: { message: "Upload cancelled" },
      },
    )
  })
})
