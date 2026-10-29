import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_LOOK } from "../domain/space-look"
import { applySpaceLook } from "./apply-look"

const root = document.documentElement
const meta = () => document.querySelector('meta[name="theme-color"]')!

beforeEach(() => {
  document.head.replaceChildren()
  const tag = document.createElement("meta")
  tag.name = "theme-color"
  tag.content = "#3225a8"
  document.head.append(tag)
})
afterEach(() => root.removeAttribute("style"))

describe("applySpaceLook", () => {
  it("sets the modes and heading font for the default look, and removes them after", () => {
    const undo = applySpaceLook(root, DEFAULT_LOOK, "light")
    expect(root.dataset).toMatchObject({
      density: "comfortable",
      radius: "soft",
      background: "solid",
    })
    expect(root.style.getPropertyValue("--primary")).toBe("")
    expect(root.style.getPropertyValue("--heading-font")).toBe("var(--font-serif)")
    undo()
    expect(root.dataset.density).toBeUndefined()
    expect(root.getAttribute("style") ?? "").toBe("")
  })

  it("puts a chosen palette inline and colours the browser bar with it", () => {
    const look = {
      ...DEFAULT_LOOK,
      button: "#1e6b66",
      corners: "rounded" as const,
      headings: "sans" as const,
    }
    const undo = applySpaceLook(root, look, "dark")
    const primary = root.style.getPropertyValue("--primary")
    expect(primary).toMatch(/^#[0-9a-f]{6}$/)
    expect(meta().getAttribute("content")).toBe(primary)
    expect(root.dataset.radius).toBe("rounded")
    expect(root.style.getPropertyValue("--heading-font")).toBe("var(--font-sans)")
    undo()
    expect(meta().getAttribute("content")).toBe("#3225a8")
  })

  it("shows the background picture at its focal point, or a solid page until it loads", () => {
    const look = { ...DEFAULT_LOOK, backgroundStyle: "image" as const, focusX: 30, focusY: 70 }
    applySpaceLook(root, look, "light")()
    expect(root.dataset.background).toBeUndefined()
    const undo = applySpaceLook(root, look, "light")
    expect(root.dataset.background).toBe("solid")
    undo()
    const withPicture = applySpaceLook(root, look, "light", "https://signed.test/p.webp")
    expect(root.dataset.background).toBe("image")
    expect(root.style.getPropertyValue("--background-image")).toBe(
      'url("https://signed.test/p.webp")',
    )
    expect(root.style.getPropertyValue("--background-focus")).toBe("30% 70%")
    withPicture()
  })

  it("leaves other inline styles, such as colour-scheme, alone", () => {
    root.style.colorScheme = "dark"
    applySpaceLook(root, { ...DEFAULT_LOOK, button: "#123456" }, "dark")()
    expect(root.style.colorScheme).toBe("dark")
  })
})
