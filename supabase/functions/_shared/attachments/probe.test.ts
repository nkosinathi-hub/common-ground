import { describe, expect, it } from "vitest"
import { SAMPLES } from "./samples.ts"
import { judgeUpload, readProbe } from "./probe.ts"
import { MAX_BYTES } from "./types.ts"

const body = new Uint8Array(32).fill(7)

describe("readProbe", () => {
  it("reads the total size from a 206 Content-Range", () => {
    const probe = readProbe(
      { status: 206, contentRange: "bytes 0-15/5000", contentLength: "16", body },
      16,
    )
    expect(probe?.total).toBe(5000)
    expect(probe?.head).toHaveLength(16)
  })

  it("accepts a 200 from a server that ignores Range", () => {
    expect(readProbe({ status: 200, contentRange: null, contentLength: "32", body }, 16)).toEqual({
      head: body.slice(0, 16),
      total: 32,
    })
    expect(
      readProbe({ status: 200, contentRange: null, contentLength: null, body }, 16)?.total,
    ).toBe(32)
  })

  it("treats missing objects and malformed ranges as no object", () => {
    expect(readProbe({ status: 404, contentRange: null, contentLength: null, body }, 16)).toBeNull()
    expect(readProbe({ status: 400, contentRange: null, contentLength: null, body }, 16)).toBeNull()
    expect(
      readProbe({ status: 206, contentRange: "bytes */5", contentLength: null, body }, 16),
    ).toBeNull()
  })
})

describe("judgeUpload", () => {
  const png = { declaredMime: "image/png" as const, bytes: 2000 }

  it("accepts content whose magic bytes and size match the declaration", () => {
    expect(judgeUpload(png, { head: SAMPLES.png, total: 2000 })).toEqual({
      ok: true,
      mime: "image/png",
    })
  })

  it("rejects spoofed content", () => {
    expect(judgeUpload(png, { head: SAMPLES.pdf, total: 2000 })).toEqual({
      ok: false,
      reason: "This file's contents do not match its type, so it was not attached",
    })
    expect(
      judgeUpload(png, { head: new TextEncoder().encode("<svg onload=x>"), total: 2000 }).ok,
    ).toBe(false)
  })

  it("rejects oversized, empty or resized uploads and missing objects", () => {
    expect(
      judgeUpload({ ...png, bytes: MAX_BYTES + 1 }, { head: SAMPLES.png, total: MAX_BYTES + 1 }),
    ).toEqual({ ok: false, reason: "Files can be at most 10 MB" })
    expect(judgeUpload(png, { head: SAMPLES.png, total: 0 }).ok).toBe(false)
    expect(judgeUpload(png, { head: SAMPLES.png, total: 2001 })).toEqual({
      ok: false,
      reason: "The uploaded file does not match its declared size",
    })
    expect(judgeUpload(png, null)).toEqual({
      ok: false,
      reason: "The upload did not arrive. Try again",
    })
  })
})
