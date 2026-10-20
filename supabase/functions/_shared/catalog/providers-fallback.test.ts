import { describe, expect, it } from "vitest"
import { groupProviders } from "./providers.ts"

describe("legal fallbacks first", () => {
  it("lists free and ad-supported options before subscriptions, rent and buy", () => {
    const { regions } = groupProviders({
      ZA: {
        buy: [{ provider_name: "Apple TV" }],
        flatrate: [{ provider_name: "Netflix" }],
        ads: [{ provider_name: "SABC+" }],
        free: [{ provider_name: "Plex" }],
      },
    })
    expect(regions[0]?.categories.map((c) => c.key)).toEqual(["free", "ads", "flatrate", "buy"])
    expect(regions[0]?.categories[1]?.label).toBe("Free with ads")
  })

  it("drops services that have closed, and a category left empty by them", () => {
    const { regions } = groupProviders({
      ZA: { flatrate: [{ provider_name: "Showmax" }, { provider_name: "Netflix" }] },
      KE: {
        flatrate: [{ provider_name: "Showmax Pro" }],
        ads: [{ provider_name: "Showmax Free" }],
      },
    })
    expect(regions.map((r) => r.code)).toEqual(["ZA"])
    expect(regions[0]?.categories[0]?.providers).toEqual(["Netflix"])
  })
})
