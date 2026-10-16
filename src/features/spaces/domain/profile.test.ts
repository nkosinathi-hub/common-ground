import { describe, expect, it } from "vitest"
import {
  SPACE_ICONS,
  validateAccent,
  validateDescription,
  validateIcon,
  validateTagline,
} from "./profile"

describe("space profile rules", () => {
  it("trims a tagline and keeps it to one short line", () => {
    expect(validateTagline("  Our corner  ")).toEqual({ ok: true, value: "Our corner" })
    expect(validateTagline("x".repeat(121))).toMatchObject({
      ok: false,
      error: { field: "tagline" },
    })
    expect(validateTagline("two\nlines").ok).toBe(false)
    expect(validateTagline("")).toEqual({ ok: true, value: "" })
  })

  it("allows a longer description, trimmed", () => {
    expect(validateDescription(" a\nb ")).toEqual({ ok: true, value: "a\nb" })
    expect(validateDescription("x".repeat(1001))).toMatchObject({
      ok: false,
      error: { field: "description" },
    })
  })

  it("accepts only icons from the allow-list, or none", () => {
    expect(SPACE_ICONS).toContain("heart")
    for (const icon of SPACE_ICONS) expect(icon).toMatch(/^[a-z0-9-]{2,40}$/)
    expect(validateIcon("heart")).toEqual({ ok: true, value: "heart" })
    expect(validateIcon(null)).toEqual({ ok: true, value: null })
    expect(validateIcon("skull")).toMatchObject({ ok: false, error: { field: "icon" } })
  })

  it("stores accents as lowercase #rrggbb, or none", () => {
    expect(validateAccent("#ABC")).toEqual({ ok: true, value: "#aabbcc" })
    expect(validateAccent(null)).toEqual({ ok: true, value: null })
    expect(validateAccent("blue")).toMatchObject({ ok: false, error: { field: "accent" } })
  })
})
