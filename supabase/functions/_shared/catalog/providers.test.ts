import { describe, expect, it } from "vitest"
import { groupProviders } from "./providers.ts"

const provider = (provider_name: string) => ({ provider_name, provider_id: 1, logo_path: "/x.png" })
const link = (code: string) => `https://www.themoviedb.org/movie/1/watch?locale=${code}`

describe("groupProviders", () => {
  it("puts South Africa first and keeps categories distinct and ordered", () => {
    const result = groupProviders({
      US: { link: link("US"), flatrate: [provider("Max")] },
      ZA: {
        link: link("ZA"),
        buy: [provider("Apple TV")],
        rent: [provider("Apple TV")],
        ads: [provider("SABC+")],
        free: [provider("Plex")],
        flatrate: [provider("Netflix"), provider("Netflix"), provider("Prime Video")],
      },
      AU: { link: link("AU"), rent: [provider("Google Play Movies")] },
    })
    expect(result.fallback).toBe(false)
    expect(result.regions.map((r) => r.code)).toEqual(["ZA", "AU", "US"])
    const za = result.regions[0]
    expect(za?.name).toBe("South Africa")
    expect(za?.categories.map((c) => [c.key, c.label, c.providers])).toEqual([
      ["free", "Free", ["Plex"]],
      ["ads", "Free with ads", ["SABC+"]],
      ["flatrate", "Subscription", ["Netflix", "Prime Video"]],
      ["rent", "Rent", ["Apple TV"]],
      ["buy", "Buy", ["Apple TV"]],
    ])
  })

  it("falls back to other countries sorted by country name when ZA has nothing", () => {
    const result = groupProviders({
      US: { flatrate: [provider("Max")] },
      DE: { buy: [provider("Amazon")] },
      ZA: { link: link("ZA") },
      GB: { rent: [provider("Sky Store")] },
    })
    expect(result.fallback).toBe(true)
    expect(result.regions.map((r) => r.name)).toEqual([
      "Germany",
      "United Kingdom",
      "United States",
    ])
  })

  it("only links to the TMDB country page, never to providers", () => {
    const result = groupProviders({
      ZA: { link: "https://www.netflix.com/title/1", flatrate: [provider("Netflix")] },
      US: { link: link("US"), flatrate: [provider("Max")] },
    })
    expect(result.regions[0]?.link).toBeNull()
    expect(result.regions[1]?.link).toBe(link("US"))
  })

  it("ignores malformed countries and entries", () => {
    const result = groupProviders({
      za: { flatrate: [provider("Lower")] },
      XX1: { flatrate: [provider("Bad")] },
      FR: { flatrate: [{ provider_name: 3 }, null, provider("Canal+")], rent: "nope" },
    })
    expect(result.regions).toEqual([
      {
        code: "FR",
        name: "France",
        link: null,
        categories: [{ key: "flatrate", label: "Subscription", providers: ["Canal+"] }],
      },
    ])
    expect(groupProviders(undefined)).toEqual({ regions: [], fallback: true })
  })
})
