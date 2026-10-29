import { describe, expect, it } from "vitest"
import { fromHsl, fromHsv, mix, normaliseHex, parseHex, toHex, toHsl, toHsv } from "./color"

describe("colour parsing", () => {
  it("reads #rrggbb and #rgb in any case, with or without the hash", () => {
    expect(parseHex("#8A4F5D")).toEqual({ r: 138, g: 79, b: 93 })
    expect(parseHex("fff")).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHex(" #0a0b0c ")).toEqual({ r: 10, g: 11, b: 12 })
  })

  it("rejects anything that is not a hex colour", () => {
    for (const raw of ["", "#12", "#12345", "#gggggg", "red", "#1234567", "rgb(1,2,3)"])
      expect(parseHex(raw)).toBeNull()
  })

  it("normalises to lowercase #rrggbb, the form the database stores", () => {
    expect(normaliseHex("#ABC")).toBe("#aabbcc")
    expect(normaliseHex("8A4F5D")).toBe("#8a4f5d")
    expect(normaliseHex("nope")).toBeNull()
  })

  it("writes channels back as hex, clamping and rounding", () => {
    expect(toHex({ r: 255.4, g: -3, b: 15.6 })).toBe("#ff0010")
  })
})

describe("colour maths", () => {
  it("round-trips through HSL", () => {
    for (const hex of ["#8a4f5d", "#000000", "#ffffff", "#ffff00", "#526b4a", "#808080"])
      expect(toHex(fromHsl(toHsl(parseHex(hex)!)))).toBe(hex)
  })

  it("mixes two colours by weight", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080")
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#0000ff")
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#ff0000")
  })

  it("converts to and from hue, saturation and value", () => {
    for (const hex of ["#3225a8", "#c7f268", "#000000", "#ffffff", "#808080"])
      expect(toHex(fromHsv(toHsv(parseHex(hex)!)))).toBe(hex)
    expect(toHsv(parseHex("#ff0000")!)).toEqual({ h: 0, s: 1, v: 1 })
  })
})
