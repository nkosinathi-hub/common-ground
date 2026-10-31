// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { FIGMA, palette, type FigmaExport } from "../../src/shared/domain/design/tokens"
import { styleName } from "./css-type"
import { rawName, variablesCss } from "./css-vars"
import { generate } from "./tokens"

const tiny: FigmaExport = {
  collections: [
    {
      name: "Layout",
      modes: ["Comfortable", "Compact"],
      variables: [
        { name: "spacing/card", values: [20, 17] },
        { name: "container/form", values: [560, 560] },
        { name: "spacing/gutter-390", values: [16, 16] },
        { name: "spacing/gutter-1024", values: [32, 32] },
      ],
    },
    {
      name: "Radius",
      modes: ["Soft", "Square"],
      variables: [{ name: "radius/lg", values: [12, 6] }],
    },
    {
      name: "Color",
      modes: ["Light", "Dark"],
      variables: [
        { name: "color/primary", values: ["#3225a8", "#d5cef7"] },
        { name: "color/sidebar", values: [{ alias: "color/primary" }, { alias: "color/primary" }] },
      ],
    },
  ],
  text: [],
  effects: [],
}

describe("design token generation", () => {
  it("names raw variables so they never collide with Tailwind's theme names", () => {
    expect(rawName("color/primary")).toBe("--primary")
    expect(rawName("spacing/card")).toBe("--space-card")
    expect(rawName("radius/lg")).toBe("--corner-lg")
    expect(rawName("container/form")).toBe("--measure-form")
    expect(rawName("field/date")).toBe("--field-date")
    expect(styleName("heading/h1")).toBe("h1")
    expect(styleName("body/default")).toBe("body")
    expect(styleName("label/sm")).toBe("label-sm")
  })

  it("writes modes as overrides of only what changes, aliases as var(), gutters mobile first", () => {
    const css = variablesCss(tiny)
    expect(css).toContain("--sidebar: var(--primary);")
    expect(css).toMatch(/\.dark \{\n {2}--primary: #d5cef7;\n\}/)
    expect(css).toMatch(/\[data-density="compact"\] \{\n {2}--space-card: 17px;\n\}/)
    expect(css).not.toMatch(/compact[^}]*measure-form/)
    expect(css).toMatch(/\[data-radius="square"\] \{\n {2}--corner-lg: 6px;\n\}/)
    expect(css).toMatch(/:root \{\n {2}--gutter: 16px;\n\}\n@media \(min-width: 1024px\)/)
  })

  it("follows aliases when reading the palette", () => {
    expect(palette("dark", tiny).sidebar).toBe("#d5cef7")
  })

  it("matches the committed CSS, so the export and the stylesheet never drift", async () => {
    for (const [path, css] of Object.entries(await generate(FIGMA)))
      expect(readFileSync(path, "utf8"), `${path}: run pnpm design:tokens`).toBe(css)
  })
})
