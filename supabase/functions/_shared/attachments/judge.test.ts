import { describe, expect, it } from "vitest"
import { judgeUpload } from "./probe.ts"
import { SAMPLES } from "./samples.ts"
import { BYTES_MAX } from "./types.ts"

const DECLARED_SIZE = 2000
const png = { declaredMime: "image/png" as const, bytes: DECLARED_SIZE }

describe("judgeUpload", () => {
  it("accepts content whose magic bytes and size match the declaration", () => {
    expect(judgeUpload(png, { head: SAMPLES.png, total: DECLARED_SIZE })).toEqual({
      ok: true,
      mime: "image/png",
    })
  })

  it("rejects spoofed content", () => {
    expect(judgeUpload(png, { head: SAMPLES.pdf, total: DECLARED_SIZE })).toEqual({
      ok: false,
      reason: "This file's contents do not match its type, so it was not attached",
    })
    const svg = new TextEncoder().encode("<svg onload=x>")
    expect(judgeUpload(png, { head: svg, total: DECLARED_SIZE }).ok).toBe(false)
  })

  it("rejects oversized, empty or resized uploads and missing objects", () => {
    const huge = { head: SAMPLES.png, total: BYTES_MAX + 1 }
    expect(judgeUpload({ ...png, bytes: BYTES_MAX + 1 }, huge)).toEqual({
      ok: false,
      reason: "Files can be at most 10 MB",
    })
    expect(judgeUpload(png, { head: SAMPLES.png, total: 0 }).ok).toBe(false)
    expect(judgeUpload(png, { head: SAMPLES.png, total: DECLARED_SIZE + 1 })).toEqual({
      ok: false,
      reason: "The uploaded file does not match its declared size",
    })
    expect(judgeUpload(png, null)).toEqual({
      ok: false,
      reason: "The upload did not arrive. Try again",
    })
  })
})
