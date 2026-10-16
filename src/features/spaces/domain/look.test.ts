import { describe, expect, it } from "vitest"
import { DEFAULT_HOME_CARDS } from "@/shared/domain"
import { DEFAULT_PROFILE, homeCardsOf, lookOf, presetOf, toPreset } from "./look"

describe("space look", () => {
  it("follows the template until the owner picks a preset", () => {
    expect(presetOf({ theme: null, template: "couple" })).toBe("couple")
    expect(presetOf({ theme: "ocean", template: "couple" })).toBe("ocean")
  })

  it("reads unknown presets as following the template", () => {
    expect(toPreset("berry")).toBe("berry")
    expect(toPreset("neon")).toBeNull()
    expect(toPreset(null)).toBeNull()
  })

  it("keeps only known Home cards, once each, in the owner's order", () => {
    expect(homeCardsOf(["ideas", "nope", "notes", "ideas"])).toEqual(["ideas", "notes"])
    expect(DEFAULT_PROFILE.homeCards).toEqual(DEFAULT_HOME_CARDS)
  })

  it("adds accent variables only when the owner chose an accent", () => {
    const plain = lookOf({ theme: null, template: "family", accent: null }, "dark")
    expect(plain).toEqual({ preset: "family", vars: {}, adjusted: false })
    const custom = lookOf({ theme: "dusk", template: "blank", accent: "#ffff00" }, "light")
    expect(custom.preset).toBe("dusk")
    expect(custom.adjusted).toBe(true)
    expect(Object.keys(custom.vars)).toContain("--primary")
  })
})
