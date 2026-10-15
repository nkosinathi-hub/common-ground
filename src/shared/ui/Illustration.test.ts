import { cleanup, render } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import EmptyState from "./EmptyState.svelte"
import Illustration from "./Illustration.svelte"

afterEach(cleanup)

const TOKEN_PAINT = /\b(fill|stroke)-(primary|clay|highlight|banner|accent|muted-foreground)\b/

function svgOf(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector("svg")
  if (!svg) throw new Error("no svg rendered")
  return svg
}

describe("Illustration", () => {
  it("is a decorative SVG hidden from assistive technology", () => {
    const svg = svgOf(render(Illustration).container)
    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).toHaveAttribute("focusable", "false")
    expect(svg.querySelector("title")).toBeNull()
  })

  it("paints every shape with theme tokens, never a hard-coded colour", () => {
    const svg = svgOf(render(Illustration).container)
    expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i)
    const shapes = svg.querySelectorAll("path, circle, ellipse, rect")
    expect(shapes.length).toBeGreaterThan(0)
    for (const shape of shapes) expect(shape.getAttribute("class")).toMatch(TOKEN_PAINT)
  })

  it("is not animated", () => {
    const svg = svgOf(render(Illustration).container)
    expect(svg.querySelector("animate, animateTransform, animateMotion")).toBeNull()
    expect(svg.outerHTML).not.toMatch(/animate-/)
  })

  it("takes the size classes it is given", () => {
    const svg = svgOf(render(Illustration, { props: { class: "h-24" } }).container)
    expect(svg.getAttribute("class")).toContain("h-24")
  })
})

describe("EmptyState with an illustration", () => {
  it("shows the illustration in place of the icon", () => {
    const { container, getByRole } = render(EmptyState, {
      props: { title: "Nothing here", illustration: true },
    })
    expect(svgOf(container)).toHaveAttribute("aria-hidden", "true")
    expect(getByRole("heading", { name: "Nothing here" })).toBeInTheDocument()
  })
})
