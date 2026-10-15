import { describe, expect, it } from "vitest"
import {
  ACCEPT,
  MAX_BYTES,
  canDelete,
  formatBytes,
  kindOf,
  mimeFromName,
  precheckFile,
} from "./rules"

const file = (name: string, type: string, size = 1000) => ({ name, type, size })

describe("precheckFile (convenience only, the server decides)", () => {
  it("accepts the four allowed types", () => {
    expect(precheckFile(file("a.jpg", "image/jpeg"))).toEqual({ ok: true, value: "image/jpeg" })
    expect(precheckFile(file("a.png", "image/png"))).toEqual({ ok: true, value: "image/png" })
    expect(precheckFile(file("a.webp", "image/webp"))).toEqual({ ok: true, value: "image/webp" })
    expect(precheckFile(file("a.PDF", "application/pdf"))).toEqual({
      ok: true,
      value: "application/pdf",
    })
  })

  it("falls back to the extension when the browser reports no type", () => {
    expect(precheckFile(file("scan.pdf", ""))).toEqual({ ok: true, value: "application/pdf" })
  })

  it("rejects other types, mismatched extensions, empty, oversized and long names", () => {
    expect(precheckFile(file("a.gif", "image/gif")).ok).toBe(false)
    expect(precheckFile(file("a.exe", "application/pdf")).ok).toBe(false)
    expect(precheckFile(file("a.png", "image/png", 0)).ok).toBe(false)
    expect(precheckFile(file("a.png", "image/png", MAX_BYTES + 1))).toEqual({
      ok: false,
      error: { kind: "validation", message: "Files can be at most 10 MB" },
    })
    expect(precheckFile(file(`${"a".repeat(200)}.png`, "image/png")).ok).toBe(false)
  })
})

describe("attachment helpers", () => {
  it("maps names and types", () => {
    expect(mimeFromName("x.JPEG")).toBe("image/jpeg")
    expect(mimeFromName("x")).toBeNull()
    expect(kindOf("application/pdf")).toBe("pdf")
    expect(kindOf("image/webp")).toBe("image")
    expect(ACCEPT).toContain("application/pdf")
    expect(ACCEPT).toContain(".webp")
  })

  it("formats sizes", () => {
    expect(formatBytes(900)).toBe("900 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB")
  })

  it("offers delete to the uploader and the owner only", () => {
    expect(canDelete("me", "me", false)).toBe(true)
    expect(canDelete("them", "me", true)).toBe(true)
    expect(canDelete("them", "me", false)).toBe(false)
    expect(canDelete(null, "me", false)).toBe(false)
  })
})
