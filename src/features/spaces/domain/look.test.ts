import { describe, expect, it } from "vitest"
import { DEFAULT_HOME_CARDS } from "@/shared/domain"
import { DEFAULT_PROFILE, homeCardsOf, storedLook } from "./look"
import { BUTTON_SWATCHES, DEFAULT_LOOK, parseLook, swatchName } from "./space-look"

describe("space look", () => {
  it("keeps only known Home cards, once each, in the owner's order", () => {
    expect(homeCardsOf(["ideas", "nope", "notes", "ideas"])).toEqual(["ideas", "notes"])
    expect(DEFAULT_PROFILE.homeCards).toEqual(DEFAULT_HOME_CARDS)
  })

  it("reads a stored look, falling back to the default for anything unknown", () => {
    expect(parseLook(null)).toEqual(DEFAULT_LOOK)
    const look = parseLook({ button: "#1E6B66", corners: "pill", density: "compact", focusX: 140 })
    expect(look).toEqual({ ...DEFAULT_LOOK, button: "#1e6b66", density: "compact" })
  })

  it("stores only what differs from the default", () => {
    expect(storedLook(DEFAULT_LOOK)).toEqual({})
    expect(storedLook({ ...DEFAULT_LOOK, corners: "rounded", focusX: 20 })).toEqual({
      corners: "rounded",
      focusX: 20,
    })
  })

  it("names a colour by its swatch, the default when none is chosen", () => {
    expect(swatchName(BUTTON_SWATCHES, null)).toBe("Indigo")
    expect(swatchName(BUTTON_SWATCHES, "#1e6b66")).toBe("Teal")
    expect(swatchName(BUTTON_SWATCHES, "#123456")).toBe("Custom")
  })
})
