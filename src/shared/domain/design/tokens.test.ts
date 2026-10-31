import { describe, expect, it } from "vitest"
import { collection, FIGMA, modesOf, palette, type FigmaExport } from "./tokens"

const broken: FigmaExport = {
  collections: [
    {
      name: "Color",
      modes: ["Light"],
      variables: [{ name: "color/x", values: [{ alias: "color/x" }] }],
    },
  ],
  text: [],
  effects: [],
}

describe("design tokens", () => {
  it("names each mode as the data attribute value it becomes", () => {
    expect(modesOf("Layout")).toEqual(["comfortable", "compact", "spacious"])
    expect(modesOf("Radius")).toEqual(["soft", "square", "rounded"])
  })

  it("resolves the sidebar to the primary in both schemes", () => {
    for (const scheme of ["light", "dark"] as const)
      expect(palette(scheme).sidebar).toBe(palette(scheme).primary)
  })

  it("refuses a missing collection and an alias that never reaches a colour", () => {
    expect(() => collection("Nope", FIGMA)).toThrow(/no "Nope"/)
    expect(() => palette("light", broken)).toThrow(/not a colour/)
  })
})
