import { describe, expect, it } from "vitest"
import { electHost } from "./host-election"
import { SYNC } from "./sync-constants"

const ana = { userId: "ana", joinedAt: "2026-10-22T20:00:00Z" }
const ben = { userId: "ben", joinedAt: "2026-10-22T20:01:00Z" }
const cat = { userId: "cat", joinedAt: "2026-10-22T20:02:00Z" }

describe("electHost", () => {
  it("keeps a host who is present", () => {
    expect(electHost({ hostId: "cat", present: [ana, cat], hostLastSeenAt: 0, now: 1e9 })).toBe(
      "cat",
    )
  })

  it("keeps an absent host until the absence limit passes", () => {
    const now = 100_000
    const seen = now - SYNC.hostAbsentMs + 1
    expect(electHost({ hostId: "cat", present: [ben, ana], hostLastSeenAt: seen, now })).toBe("cat")
  })

  it("hands over to the earliest-joined member once the host is gone long enough", () => {
    const now = 100_000
    const seen = now - SYNC.hostAbsentMs
    expect(electHost({ hostId: "cat", present: [ben, ana], hostLastSeenAt: seen, now })).toBe("ana")
  })

  it("breaks a joining tie by id, so every client agrees", () => {
    const twin = { userId: "aaa", joinedAt: ana.joinedAt }
    expect(electHost({ hostId: "cat", present: [ana, twin], hostLastSeenAt: 0, now: 1e9 })).toBe(
      "aaa",
    )
  })

  it("keeps the host when nobody else is there", () => {
    expect(electHost({ hostId: "cat", present: [], hostLastSeenAt: 0, now: 1e9 })).toBe("cat")
  })
})
