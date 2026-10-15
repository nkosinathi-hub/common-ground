// @vitest-environment node
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const publicDir = fileURLToPath(new URL("../../public/", import.meta.url))
const read = (name: string) => readFileSync(`${publicDir}${name}`)

interface Icon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

/** Width, height and colour type straight from the PNG IHDR chunk. */
function pngHeader(bytes: Buffer) {
  const signature = bytes.subarray(0, 8).toString("hex")
  return {
    signature,
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes.readUInt8(25),
  }
}

const manifest = JSON.parse(read("manifest.webmanifest").toString()) as { icons: Icon[] }
const PNG_SIGNATURE = "89504e470d0a1a0a"
const RGB = 2

describe("PWA icons", () => {
  it.each([
    ["icon-192.png", "192x192", "any"],
    ["icon-512.png", "512x512", "any"],
    ["icon-maskable-512.png", "512x512", "maskable"],
  ])("the manifest lists %s at %s for %s", (src, sizes, purpose) => {
    expect(manifest.icons).toContainEqual({ src, sizes, type: "image/png", purpose })
  })

  it("every manifest icon exists with the dimensions it declares", () => {
    for (const icon of manifest.icons) {
      expect(existsSync(`${publicDir}${icon.src}`)).toBe(true)
      if (icon.type !== "image/png") continue
      const header = pngHeader(read(icon.src))
      expect(header.signature).toBe(PNG_SIGNATURE)
      expect(`${header.width}x${header.height}`).toBe(icon.sizes)
    }
  })

  it("the apple touch icon is an opaque 180x180 PNG", () => {
    const header = pngHeader(read("apple-touch-icon.png"))
    expect(header).toEqual({ signature: PNG_SIGNATURE, width: 180, height: 180, colorType: RGB })
  })

  it("index.html links the apple touch icon relative to the base", () => {
    const html = readFileSync(fileURLToPath(new URL("../../index.html", import.meta.url)), "utf8")
    expect(html).toContain('<link rel="apple-touch-icon" href="./apple-touch-icon.png" />')
  })
})
