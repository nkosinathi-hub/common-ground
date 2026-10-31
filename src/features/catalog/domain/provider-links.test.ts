import { describe, expect, it } from "vitest"
import { providerLink } from "./provider-links"

describe("providerLink", () => {
  it("searches the service's own site for the title", () => {
    expect(providerLink("Netflix", "Ted Lasso")).toBe(
      "https://www.netflix.com/search?q=Ted%20Lasso",
    )
    expect(providerLink("Apple TV Plus", "Ted Lasso")).toBe(
      "https://tv.apple.com/search?term=Ted%20Lasso",
    )
    expect(providerLink("Disney Plus", "Shōgun")).toContain("disneyplus.com/search?q=Sh%C5%8Dgun")
    expect(providerLink("Amazon Prime Video", "Dune & more")).toContain("phrase=Dune%20%26%20more")
  })

  it("leaves services it does not know to the listing page", () => {
    expect(providerLink("Some Local Service", "Arrival")).toBeNull()
  })
})
