import { describe, expect, it } from "vitest"
import { safeComment, toHit } from "./search-row"

describe("search result safety and destinations", () => {
  it("hides explicit spoilers and ahead-of-viewer discussion even if another member is ahead", () => {
    const row = {
      season: 1,
      episode: 3,
      spoiler: false,
      watch_items: {
        watch_progress: [
          { user_id: "other", season: 5, episode: 1 },
          { user_id: "me", season: 1, episode: 2 },
        ],
      },
    }
    expect(safeComment(row, "me")).toBe(false)
    expect(safeComment({ ...row, episode: 2 }, "me")).toBe(true)
    expect(safeComment({ ...row, season: 0 }, "me")).toBe(true)
    expect(safeComment({ ...row, spoiler: true }, "me")).toBe(false)
    expect(safeComment({ season: 1, episode: 1 }, "me")).toBe(false)
    expect(safeComment({ season: null, episode: 1 }, "me")).toBe(false)
    expect(safeComment({ season: null, episode: null }, "me")).toBe(true)
  })
  it("opens the exact note, event or relevant idea tab", () => {
    expect(toHit({ id: "n1", body: "hello" }, "note", "s")[0]?.route).toEqual({
      name: "note",
      spaceId: "s",
      noteId: "n1",
    })
    expect(toHit({ id: "e1", title: "Picnic" }, "event", "s")[0]?.route).toEqual({
      name: "event",
      spaceId: "s",
      eventId: "e1",
    })
    expect(toHit({ id: "t1", title: "Pack", idea_id: "i" }, "task", "s")[0]?.route).toEqual({
      name: "idea",
      spaceId: "s",
      ideaId: "i",
      tab: "tasks",
    })
    expect(
      toHit({ id: "c1", body: "Hi", watch_item_id: "w" }, "discussion", "s")[0]?.route,
    ).toEqual({ name: "watch-item", spaceId: "s", itemId: "w", tab: "discussion" })
    expect(toHit({ id: "t1" }, "task", "s")).toEqual([])
    expect(toHit(null, "watch", "s")).toEqual([])
  })
})
