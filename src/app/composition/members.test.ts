import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { authorDirectory } from "./members"

const member = (userId: string, displayName: string) => ({
  userId,
  displayName,
  role: "member" as const,
  joinedAt: "2026-10-01T00:00:00Z",
})

describe("authorDirectory", () => {
  it("names current members first, then removed people whose profile is still visible", async () => {
    const spaces = {
      members: async () => ok([member("ana", "Ana")]),
      knownPeople: async () =>
        ok([
          { id: "ana", displayName: "Ana (old)" },
          { id: "ben", displayName: "Ben" },
        ]),
    }
    expect(await authorDirectory(spaces).authors("s")).toEqual(
      ok([
        { id: "ana", displayName: "Ana" },
        { id: "ben", displayName: "Ben" },
      ]),
    )
  })

  it("fails when either list fails", async () => {
    const down = async () => err(appError("network", "down"))
    const spaces = { members: down, knownPeople: async () => ok([]) }
    expect((await authorDirectory(spaces).authors("s")).ok).toBe(false)
    const known = { members: async () => ok([]), knownPeople: down }
    expect((await authorDirectory(known).authors("s")).ok).toBe(false)
  })
})
