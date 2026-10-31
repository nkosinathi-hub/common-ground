import { describe, expect, it } from "vitest"
import { hiddenNotice, isAhead, visibleTo } from "./episodes"

const names = [
  { id: "b", displayName: "Ben" },
  { id: "c", displayName: "Cy" },
]

describe("episode gating", () => {
  it("hides what is past your place, and every tagged comment before you start", () => {
    const place = { season: 1, episode: 3 }
    expect(isAhead({ season: 1, episode: 4 }, place)).toBe(true)
    expect(isAhead({ season: 2, episode: 1 }, place)).toBe(true)
    expect(isAhead({ season: 1, episode: 3 }, place)).toBe(false)
    expect(isAhead(null, place)).toBe(false)
    expect(isAhead({ season: 1, episode: 1 }, null)).toBe(true)
    expect(visibleTo(null)({ tag: null })).toBe(true)
  })

  it("says who is ahead and which episodes wait, without the words", () => {
    const hidden = [
      { authorId: "b", tag: { season: 1, episode: 5 } },
      { authorId: "b", tag: { season: 1, episode: 4 } },
    ]
    expect(hiddenNotice(hidden, names)).toBe("Ben is ahead. 2 comments about E4 and E5 are hidden.")
    expect(hiddenNotice([{ authorId: "c", tag: { season: 2, episode: 1 } }], names)).toBe(
      "Cy is ahead. 1 comment about S2E1 is hidden.",
    )
    const three = [...hidden, { authorId: "c", tag: { season: 1, episode: 6 } }]
    expect(hiddenNotice(three, names)).toBe(
      "Ben and Cy are ahead. 3 comments about E4, E5 and E6 are hidden.",
    )
    expect(hiddenNotice([], names)).toBeNull()
  })
})
