import { describe, expect, it } from "vitest"
import { buildHash, parseHash, type Route } from "./routes"

const id = "8f9c2d1e-0b5a-4c3f-9e7d-112233445566"
const other = "0a1b2c3d-4e5f-4a6b-8c7d-998877665544"

const cases: [string, Route][] = [
  ["#/auth/sign-in", { name: "sign-in" }],
  ["#/auth/sign-up", { name: "sign-up" }],
  ["#/auth/reset", { name: "reset" }],
  ["#/auth/new-password", { name: "new-password" }],
  ["#/invite/abcDEF123_-", { name: "invite", token: "abcDEF123_-" }],
  ["#/spaces/new", { name: "new-space" }],
  ["#/account", { name: "account" }],
  ["#/privacy", { name: "privacy" }],
  [`#/s/${id}/home`, { name: "home", spaceId: id }],
  [`#/s/${id}/watch`, { name: "watch", spaceId: id }],
  [`#/s/${id}/watch/${other}`, { name: "watch-item", spaceId: id, itemId: other }],
  [`#/s/${id}/ideas`, { name: "ideas", spaceId: id }],
  [`#/s/${id}/ideas/${other}/tasks`, { name: "idea", spaceId: id, ideaId: other, tab: "tasks" }],
  [`#/s/${id}/settings`, { name: "settings", spaceId: id }],
  [`#/s/${id}/calendar`, { name: "calendar", spaceId: id }],
  [`#/s/${id}/calendar/${other}`, { name: "event", spaceId: id, eventId: other }],
]

describe("hash routes", () => {
  it.each(cases)("parses and rebuilds %s", (hash, route) => {
    expect(parseHash(hash)).toEqual(route)
    expect(buildHash(route)).toBe(hash)
  })

  it("treats empty hash as the entry route", () => {
    expect(parseHash("")).toEqual({ name: "entry" })
    expect(parseHash("#/")).toEqual({ name: "entry" })
  })

  it("defaults an idea without a tab to overview", () => {
    expect(parseHash(`#/s/${id}/ideas/${other}`)).toEqual({
      name: "idea",
      spaceId: id,
      ideaId: other,
      tab: "overview",
    })
  })

  it("rejects malformed ids, tabs and unknown paths", () => {
    for (const hash of [
      "#/s/not-a-uuid/home",
      `#/s/${id}/ideas/${other}/hack`,
      "#/nope",
      "#/invite/",
    ]) {
      expect(parseHash(hash)).toEqual({ name: "not-found" })
    }
  })

  it("ignores a query string after the path", () => {
    expect(parseHash(`#/s/${id}/watch?x=1`)).toEqual({ name: "watch", spaceId: id })
  })
})
