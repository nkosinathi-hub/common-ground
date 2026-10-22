import { describe, expect, it } from "vitest"
import { whoIsIn } from "./who-is-in"

const member = (userId: string) => ({ userId, confirmed: false, joinedAt: "2026-10-22T20:00:00Z" })
const here = (userId: string) => ({ userId, ready: false, buffering: false, joinedAt: "x" })

describe("whoIsIn", () => {
  it("lists the members the page loaded, then anyone who joined since and is here", () => {
    // Found with two real browsers: the host's list never gained the guest who joined after.
    expect(whoIsIn([member("ana")], [here("ana"), here("ben")])).toEqual(["ana", "ben"])
  })

  it("lists a member once however many devices they are on", () => {
    expect(whoIsIn([member("ana")], [here("ben"), here("ben"), here("ana")])).toEqual([
      "ana",
      "ben",
    ])
  })

  it("keeps members who are not here yet", () => {
    expect(whoIsIn([member("ana"), member("ben")], [])).toEqual(["ana", "ben"])
  })
})
