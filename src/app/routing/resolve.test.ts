import { describe, expect, it } from "vitest"
import { resolveRoute, type Gate } from "./resolve"

const signedOut: Gate = { signedIn: false, spaceIds: [], activeSpaceId: null, pendingInvite: null }
const member: Gate = {
  signedIn: true,
  spaceIds: ["s1", "s2"],
  activeSpaceId: "s2",
  pendingInvite: null,
}

describe("resolveRoute", () => {
  it("sends signed-out visitors to sign in, except public pages", () => {
    expect(resolveRoute({ name: "home", spaceId: "s1" }, signedOut)).toEqual({
      kind: "redirect",
      route: { name: "sign-in" },
    })
    expect(resolveRoute({ name: "privacy" }, signedOut).kind).toBe("render")
    expect(resolveRoute({ name: "invite", token: "t" }, signedOut).kind).toBe("render")
  })

  it("sends a signed-in user to the active space, or to create one", () => {
    expect(resolveRoute({ name: "entry" }, member)).toEqual({
      kind: "redirect",
      route: { name: "home", spaceId: "s2" },
    })
    expect(
      resolveRoute({ name: "sign-in" }, { ...member, spaceIds: [], activeSpaceId: null }),
    ).toEqual({
      kind: "redirect",
      route: { name: "new-space" },
    })
  })

  it("never reveals a space the user is not in", () => {
    expect(resolveRoute({ name: "watch", spaceId: "other" }, member)).toEqual({
      kind: "render",
      route: { name: "not-found" },
    })
  })

  it("resumes an invite after signing in", () => {
    expect(resolveRoute({ name: "entry" }, { ...member, pendingInvite: "tok" })).toEqual({
      kind: "redirect",
      route: { name: "invite", token: "tok" },
    })
  })
})
