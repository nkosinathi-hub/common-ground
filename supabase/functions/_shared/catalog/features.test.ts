import { describe, expect, it } from "vitest"
import { featuresOf } from "./features.ts"
import type { TitleDetails } from "./types.ts"

const details = (keys: string[], fallback = false): TitleDetails =>
  ({
    title: { genres: ["drama"] },
    availability: {
      fallback,
      regions: [
        {
          code: "ZA",
          name: "South Africa",
          link: null,
          categories: keys.map((key) => ({ key, label: key, providers: ["Showmax"] })),
        },
      ],
    },
  }) as unknown as TitleDetails

describe("featuresOf", () => {
  it("streams here only with a subscription, free or ads listing in South Africa", () => {
    expect(featuresOf("s", "tv", 1, details(["flatrate"]))).toEqual({
      spaceId: "s",
      type: "tv",
      id: 1,
      genres: ["drama"],
      streamable: true,
    })
    expect(featuresOf("s", "tv", 1, details(["rent", "buy"])).streamable).toBe(false)
    expect(featuresOf("s", "tv", 1, details(["flatrate"], true)).streamable).toBe(false)
  })
})
