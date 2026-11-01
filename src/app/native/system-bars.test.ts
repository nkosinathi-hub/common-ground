import { describe, expect, it } from "vitest"
import { barSync, toHex, type BarColors } from "./system-bars"

describe("toHex", () => {
  it("writes a pixel as #rrggbb, the form Android parses", () => {
    expect(toHex([238, 235, 248])).toBe("#eeebf8")
    expect(toHex([0, 8, 255])).toBe("#0008ff")
  })
})

describe("barSync", () => {
  it("sends the colours once, and again only when the theme or a space's look changes them", () => {
    const sent: BarColors[] = []
    let current: BarColors = { top: "#eeebf8", bottom: "#ffffff" }
    const sync = barSync(
      () => current,
      (colors) => sent.push(colors),
    )
    sync()
    sync()
    current = { top: "#1b1730", bottom: "#24203a" }
    sync()
    expect(sent).toEqual([
      { top: "#eeebf8", bottom: "#ffffff" },
      { top: "#1b1730", bottom: "#24203a" },
    ])
  })
})
