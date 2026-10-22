import { describe, expect, it } from "vitest"
import { partyOf } from "@/features/parties/testing/fake-party-gateway"
import { partyRows } from "./party-list"

const names = [
  { id: "ana", displayName: "Ana" },
  { id: "ben", displayName: "Ben" },
]
const joined = "2026-10-22T20:00:00Z"

describe("the popup's list of Netflix parties", () => {
  it("names the title, the episodes, the host and who is in and ready", () => {
    const party = partyOf("p1", "ana", {
      source: "netflix",
      range: { from: { season: 1, episode: 2 }, to: { season: 1, episode: 3 } },
      members: [
        { userId: "ana", confirmed: true, joinedAt: joined },
        { userId: "ben", confirmed: false, joinedAt: joined },
      ],
    })
    expect(partyRows([party], names, "cat", null)).toEqual([
      {
        id: "p1",
        title: "Severance",
        what: "S1E2 to S1E3",
        netflixUrl: "https://www.netflix.com/search?q=Severance",
        people: [
          { name: "Ana", ready: true, host: true },
          { name: "Ben", ready: false, host: false },
        ],
        joined: false,
        active: false,
      },
    ])
  })

  it("calls a film a film, and marks the party this member joined and plays", () => {
    const party = partyOf("p2", "ana", { source: "netflix", range: null })
    const [row] = partyRows([party], names, "ana", "p2")
    expect(row).toMatchObject({ what: "The film", joined: true, active: true })
  })

  it("lists only open Netflix parties", () => {
    const parties = [
      partyOf("p1", "ana", { source: "jellyfin" }),
      partyOf("p2", "ana", { source: "netflix", status: "ended" }),
      partyOf("p3", "ana", { source: "netflix", status: "live" }),
    ]
    expect(partyRows(parties, names, "ana", null).map((r) => r.id)).toEqual(["p3"])
  })

  it("names a member who left the space as a former member", () => {
    const party = partyOf("p1", "gone", { source: "netflix" })
    expect(partyRows([party], names, "ana", null)[0]?.people[0]?.name).toBe("Former member")
  })
})
