import { describe, expect, it } from "vitest"
import { isFramed, refuseFrame } from "./framing"

const view = (top: unknown) => ({ self: {}, top }) as unknown as Window

describe("framing", () => {
  it("knows when the app is shown inside another page", () => {
    const self = {} as Window
    expect(isFramed({ self, top: self } as unknown as Window)).toBe(false)
    expect(isFramed(view({}))).toBe(true)
    expect(isFramed(view(null))).toBe(true)
  })

  it("shows only a way out instead of the app when framed", () => {
    const target = document.createElement("div")
    refuseFrame(target, "https://x.github.io/common-ground/")
    const link = target.querySelector("a")!
    expect(target.textContent).toContain("Common Ground only opens in its own tab")
    expect(link.getAttribute("href")).toBe("https://x.github.io/common-ground/")
    expect(link.getAttribute("target")).toBe("_top")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(target.querySelector("button, input, form")).toBeNull()
  })
})
