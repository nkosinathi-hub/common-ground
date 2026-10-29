import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { applySpaceLook } from "./apply-look"

const root = document.documentElement
const meta = () => document.querySelector('meta[name="theme-color"]')!

beforeEach(() => {
  document.head.replaceChildren()
  const tag = document.createElement("meta")
  tag.name = "theme-color"
  tag.content = "#526b4a"
  document.head.append(tag)
})
afterEach(() => {
  root.removeAttribute("style")
  delete root.dataset.spaceTheme
})

describe("applySpaceLook", () => {
  it("sets the preset, falling back to the template, and cleans up after itself", () => {
    const undo = applySpaceLook(root, { theme: null, template: "couple", accent: null }, "light")
    expect(root.dataset.spaceTheme).toBe("couple")
    expect(root.style.getPropertyValue("--primary")).toBe("")
    undo()
    expect(root.dataset.spaceTheme).toBeUndefined()
  })

  it("puts a custom accent inline for the mode and colours the browser bar with it", () => {
    const space = { theme: "ocean" as const, template: "blank" as const, accent: "#ffff00" }
    const undo = applySpaceLook(root, space, "dark")
    expect(root.dataset.spaceTheme).toBe("ocean")
    const primary = root.style.getPropertyValue("--primary")
    expect(primary).toMatch(/^#[0-9a-f]{6}$/)
    expect(root.style.getPropertyValue("--secondary")).not.toBe("")
    expect(meta().getAttribute("content")).toBe(primary)
    undo()
    expect(root.getAttribute("style") ?? "").not.toContain("--primary")
    expect(meta().getAttribute("content")).toBe("#526b4a")
  })

  it("leaves other inline styles, such as colour-scheme, alone", () => {
    root.style.colorScheme = "dark"
    applySpaceLook(root, { theme: null, template: "blank", accent: "#123456" }, "dark")()
    expect(root.style.colorScheme).toBe("dark")
  })
})
