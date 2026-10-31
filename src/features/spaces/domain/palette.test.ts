import { describe, expect, it } from "vitest"
import { TEXT_PAIRS } from "@/shared/domain/design/pairs"
import { palette } from "@/shared/domain/design/tokens"
import { contrastRatio } from "./contrast"
import { paletteFor } from "./palette"
import {
  BACKGROUND_SWATCHES,
  BUTTON_SWATCHES,
  CARD_SWATCHES,
  DEFAULT_LOOK,
  type SpaceLook,
} from "./space-look"

const SCHEMES = ["light", "dark"] as const

/** The colours on screen: the design palette with the look's variables over it. */
function onScreen(look: SpaceLook, scheme: (typeof SCHEMES)[number]) {
  const colours = { ...palette(scheme) }
  for (const [name, value] of Object.entries(paletteFor(look, scheme).vars))
    colours[name.slice(2)] = value.startsWith("var(") ? colours[value.slice(6, -1)]! : value
  return colours
}

const failures = (look: SpaceLook, scheme: (typeof SCHEMES)[number]) => {
  const c = onScreen(look, scheme)
  return TEXT_PAIRS.filter(([text, surface]) => contrastRatio(c[text]!, c[surface]!) < 4.5)
}

describe("paletteFor", () => {
  it("leaves the design tokens untouched when nothing is chosen", () => {
    for (const scheme of SCHEMES) expect(paletteFor(DEFAULT_LOOK, scheme).vars).toEqual({})
  })

  it("keeps every text pair readable for every swatch combination, in both schemes", () => {
    for (const background of BACKGROUND_SWATCHES)
      for (const card of CARD_SWATCHES)
        for (const button of BUTTON_SWATCHES)
          for (const sidebar of ["filled", "light"] as const) {
            const look = {
              ...DEFAULT_LOOK,
              background: background.hex,
              card: card.hex,
              button: button.hex,
              sidebar,
            }
            for (const scheme of SCHEMES)
              expect(failures(look, scheme), `${button.name} ${scheme}`).toEqual([])
          }
  })

  it("moves unreadable custom picks and says which", () => {
    const pale = { ...DEFAULT_LOOK, button: "#ffee00", background: "#202020" }
    const light = paletteFor(pale, "light")
    expect(light.adjusted).toEqual(["button", "surface"])
    expect(failures(pale, "light")).toEqual([])
    expect(failures(pale, "dark")).toEqual([])
  })

  it("follows the button colour into dark mode, and draws a light sidebar on the cards", () => {
    const teal = paletteFor({ ...DEFAULT_LOOK, button: "#1e6b66", sidebar: "light" }, "dark").vars
    expect(teal["--primary"]).not.toBe(palette("dark").primary)
    expect(teal["--sidebar"]).toBe("var(--card)")
  })
})
