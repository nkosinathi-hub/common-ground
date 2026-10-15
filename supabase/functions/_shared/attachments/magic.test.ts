import { describe, expect, it } from "vitest"
import { sniffMime } from "./magic.ts"
import { bytes, SAMPLES } from "./samples.ts"

describe("sniffMime", () => {
  it("recognises JPEG, PNG, WebP and PDF by their leading bytes", () => {
    expect(sniffMime(SAMPLES.jpeg)).toBe("image/jpeg")
    expect(sniffMime(SAMPLES.png)).toBe("image/png")
    expect(sniffMime(SAMPLES.webp)).toBe("image/webp")
    expect(sniffMime(SAMPLES.pdf)).toBe("application/pdf")
  })

  it("rejects look-alikes and other formats", () => {
    expect(sniffMime(bytes("RIFF", 0x24, 0, 0, 0, "WAVEfmt "))).toBeNull()
    expect(sniffMime(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a))).toBeNull()
    expect(sniffMime(bytes("%PDF"))).toBeNull()
    expect(sniffMime(bytes("GIF89a"))).toBeNull()
    expect(sniffMime(bytes("<html><script>"))).toBeNull()
    expect(sniffMime(bytes(0xff, 0xd8))).toBeNull()
    expect(sniffMime(new Uint8Array())).toBeNull()
  })
})
