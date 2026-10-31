import { describe, expect, it } from "vitest"
import { peopleLine, utcOffset, zoneCity } from "./zone-label"

const OCT = Date.parse("2026-10-27T18:00:00Z")

describe("zone labels", () => {
  it("writes a zone's offset at an instant", () => {
    expect(utcOffset("Africa/Johannesburg", OCT)).toBe("UTC+2")
    expect(utcOffset("Asia/Kolkata", OCT)).toBe("UTC+5:30")
    expect(utcOffset("America/Sao_Paulo", OCT)).toBe("UTC-3")
    expect(utcOffset("UTC", OCT)).toBe("UTC")
  })

  it("names the city a zone is named after", () => {
    expect(zoneCity("Africa/Johannesburg")).toBe("Johannesburg")
    expect(zoneCity("America/Sao_Paulo")).toBe("Sao Paulo")
  })

  it("joins people as a sentence would", () => {
    expect(peopleLine([])).toBe("")
    expect(peopleLine(["Ana"])).toBe("Ana")
    expect(peopleLine(["Ana", "Ben"])).toBe("Ana & Ben")
    expect(peopleLine(["Ana", "Ben", "Cat"])).toBe("Ana, Ben & Cat")
  })
})
