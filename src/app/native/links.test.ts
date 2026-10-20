import { describe, expect, it } from "vitest"
import { backAction, inAppPath, pushRoute } from "./links"

const site = "https://nkosinathi-hub.github.io/common-ground/"

describe("inAppPath", () => {
  const link = `${site}app-link/`

  it("keeps the query and hash of an email link so boot can finish it", () => {
    expect(inAppPath(`${link}?next=home&code=abc`, site)).toBe("/?next=home&code=abc")
  })

  it("opens an invite link at its route", () => {
    expect(inAppPath(`${link}#/invite/tok_123`, site)).toBe("/#/invite/tok_123")
    expect(inAppPath(`${site}app-link/index.html#/invite/t`, site)).toBe("/#/invite/t")
  })

  it("leaves the website's own pages to the browser", () => {
    expect(inAppPath(`${site}?code=abc`, site)).toBeNull()
    expect(inAppPath(`${site}app/common-ground.apk`, site)).toBeNull()
  })

  it("ignores links to anywhere else", () => {
    expect(inAppPath("https://nkosinathi-hub.github.io/other/app-link/#/x", site)).toBeNull()
    expect(inAppPath("https://evil.example/common-ground/app-link/?code=1", site)).toBeNull()
    expect(inAppPath("not a url", site)).toBeNull()
  })
})

describe("backAction", () => {
  it("goes back while there is somewhere to go", () => {
    expect(backAction("#/s/0b6c8a2e-6f43-4b8e-9c55-1d4a3c9e7f10/ideas", true)).toBe("back")
  })

  it("leaves the app from a root page or an empty history", () => {
    expect(backAction("", true)).toBe("leave")
    expect(backAction("#/auth/sign-in", true)).toBe("leave")
    expect(backAction("#/s/0b6c8a2e-6f43-4b8e-9c55-1d4a3c9e7f10", true)).toBe("leave")
    expect(backAction("#/account", false)).toBe("leave")
  })
})

describe("pushRoute", () => {
  it("opens the route a push carries", () => {
    expect(pushRoute({ route: "#/account" })).toBe("#/account")
  })

  it("refuses anything that is not an app route", () => {
    expect(pushRoute({ route: "https://evil.example" })).toBeNull()
    expect(pushRoute({ route: "#/nowhere" })).toBeNull()
    expect(pushRoute({})).toBeNull()
    expect(pushRoute({ route: 3 })).toBeNull()
  })
})
