import { describe, expect, it } from "vitest"
import { buildHash, parseHash, queryOf, withQuery, type Route } from "./routes"

const id = "8f9c2d1e-0b5a-4c3f-9e7d-112233445566"
const other = "0a1b2c3d-4e5f-4a6b-8c7d-998877665544"

const cases: [string, Route][] = [
  ["#/demo", { name: "demo" }],
  ["#/auth/sign-in", { name: "sign-in" }],
  ["#/auth/sign-up", { name: "sign-up" }],
  ["#/auth/reset", { name: "reset" }],
  ["#/auth/new-password", { name: "new-password" }],
  ["#/invite/abcDEF123_-", { name: "invite", token: "abcDEF123_-" }],
  ["#/spaces/new", { name: "new-space" }],
  ["#/account", { name: "account" }],
  ["#/account/data", { name: "account", tab: "data" }],
  ["#/privacy", { name: "privacy" }],
  ["#/account/privacy/rights", { name: "privacy", part: "rights" }],
  [`#/s/${id}/home`, { name: "home", spaceId: id }],
  [`#/s/${id}/watch`, { name: "watch", spaceId: id }],
  [`#/s/${id}/watch/${other}`, { name: "watch-item", spaceId: id, itemId: other }],
  [
    `#/s/${id}/watch/${other}/episodes`,
    { name: "watch-item", spaceId: id, itemId: other, tab: "episodes" },
  ],
  [`#/s/${id}/home/notes`, { name: "notes", spaceId: id }],
  [`#/s/${id}/home/notes/${other}`, { name: "note", spaceId: id, noteId: other }],
  [`#/s/${id}/ideas`, { name: "ideas", spaceId: id }],
  [`#/s/${id}/ideas/${other}/tasks`, { name: "idea", spaceId: id, ideaId: other, tab: "tasks" }],
  [`#/s/${id}/settings`, { name: "settings", spaceId: id }],
  [`#/s/${id}/settings/members`, { name: "settings", spaceId: id, tab: "members" }],
  [`#/s/${id}/calendar`, { name: "calendar", spaceId: id }],
  [`#/s/${id}/calendar/${other}`, { name: "event", spaceId: id, eventId: other }],
  [`#/s/${id}/party/${other}`, { name: "party", spaceId: id, partyId: other }],
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
      `#/s/${id}/party`,
      `#/s/${id}/party/${other}/extra`,
      `#/s/${id}/settings/colours`,
      `#/s/${id}/settings/members/extra`,
      `#/s/${id}/watch/${other}/cast`,
      `#/s/${id}/home/notes/not-a-uuid`,
      `#/s/${id}/home/other`,
      `#/s/${id}/calendar/${other}/edit`,
      "#/account/billing",
      "#/account/privacy/cookies",
    ]) {
      expect(parseHash(hash)).toEqual({ name: "not-found" })
    }
  })

  it("ignores a query string after the path", () => {
    expect(parseHash(`#/s/${id}/watch?x=1`)).toEqual({ name: "watch", spaceId: id })
  })

  it("keeps view state in the query, leaving defaults out of the link", () => {
    const hash = withQuery(`#/s/${id}/ideas?old=1`, { view: "board", day: null })
    expect(hash).toBe(`#/s/${id}/ideas?view=board`)
    expect(queryOf(hash).get("view")).toBe("board")
    expect(parseHash(hash)).toEqual({ name: "ideas", spaceId: id })
    expect(withQuery(hash, { view: undefined })).toBe(`#/s/${id}/ideas`)
  })
})
