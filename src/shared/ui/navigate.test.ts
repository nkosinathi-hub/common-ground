import { afterEach, describe, expect, it } from "vitest"
import { navigate } from "./navigate"

afterEach(() => (window.location.hash = ""))

describe("navigate", () => {
  it("moves to a route through its hash, so the router and history follow", () => {
    navigate({ name: "account" })
    expect(window.location.hash).toBe("#/account")
    navigate({ name: "ideas", spaceId: "s1" })
    expect(window.location.hash).toBe("#/s/s1/ideas")
  })

  it("takes a hash a parent already built", () => {
    navigate("#/privacy")
    expect(window.location.hash).toBe("#/privacy")
  })
})
