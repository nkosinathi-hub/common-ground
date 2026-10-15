import { describe, expect, it } from "vitest"
import { checkFilename, checkSize, checkUpload, extensionOf, isAllowedMime } from "./rules.ts"
import { MAX_BYTES } from "./types.ts"

const intent = (filename: string, mime: string, bytes = 1000) =>
  checkUpload({ filename, mime, bytes })

describe("upload rules", () => {
  it("accepts the four allowed types with matching extensions", () => {
    for (const [name, mime] of [
      ["photo.JPG", "image/jpeg"],
      ["photo.jpeg", "image/jpeg"],
      ["logo.png", "image/png"],
      ["hero.webp", "image/webp"],
      ["plan.v2.pdf", "application/pdf"],
    ] as const)
      expect(intent(name, mime)).toEqual({
        ok: true,
        value: { filename: name, mime, bytes: 1000 },
      })
  })

  it("rejects types outside the allowlist", () => {
    expect(intent("anim.gif", "image/gif")).toMatchObject({ ok: false })
    expect(intent("page.html", "text/html")).toMatchObject({ ok: false })
    expect(isAllowedMime("toString")).toBe(false)
  })

  it("rejects an extension that does not match the declared type", () => {
    expect(intent("evil.exe", "application/pdf")).toEqual({
      ok: false,
      message: "The file extension does not match its type",
    })
    expect(intent("photo.png", "image/jpeg")).toMatchObject({ ok: false })
    expect(intent("noextension", "image/png")).toMatchObject({ ok: false })
    expect(intent(".png", "image/png")).toMatchObject({ ok: false })
  })

  it("enforces 1 byte to 10 MB", () => {
    expect(intent("a.pdf", "application/pdf", MAX_BYTES).ok).toBe(true)
    expect(intent("a.pdf", "application/pdf", MAX_BYTES + 1)).toEqual({
      ok: false,
      message: "Files can be at most 10 MB",
    })
    expect(checkSize(0).ok).toBe(false)
    expect(checkSize(1.5).ok).toBe(false)
    expect(checkSize(Number.NaN).ok).toBe(false)
  })

  it("trims names and refuses empty, long, slashed or control-character names", () => {
    expect(checkFilename("  plan.pdf ")).toEqual({ ok: true, value: "plan.pdf" })
    expect(checkFilename("   ").ok).toBe(false)
    expect(checkFilename(`${"a".repeat(196)}.pdf`).ok).toBe(true)
    expect(checkFilename(`${"a".repeat(197)}.pdf`).ok).toBe(false)
    expect(checkFilename("../etc/passwd.pdf").ok).toBe(false)
    expect(checkFilename("a\\b.pdf").ok).toBe(false)
    expect(checkFilename("a\nb.pdf").ok).toBe(false)
  })

  it("reads the last extension in lower case", () => {
    expect(extensionOf("Archive.Tar.PDF")).toBe("pdf")
    expect(extensionOf("README")).toBe("")
  })
})
