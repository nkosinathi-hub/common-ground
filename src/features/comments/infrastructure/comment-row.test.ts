import { describe, expect, it } from "vitest"
import { parentColumn, toComment, type CommentRow } from "./comment-row"

const row: CommentRow = {
  id: "c1",
  space_id: "s",
  watch_item_id: null,
  idea_id: "i1",
  author_id: null,
  body: "Hi",
  spoiler: true,
  edited: false,
  created_at: "2026-10-15T10:00:00+00:00",
  comment_mentions: [{ user_id: "b" }],
}

describe("comment rows", () => {
  it("maps a row to a comment, preferring explicitly known mentions", () => {
    expect(toComment(row)).toMatchObject({
      parent: { kind: "idea", id: "i1" },
      authorId: null,
      spoiler: true,
      mentionIds: ["b"],
    })
    expect(toComment({ ...row, watch_item_id: "w1", idea_id: null }, ["x"])).toMatchObject({
      parent: { kind: "watch", id: "w1" },
      mentionIds: ["x"],
    })
  })

  it("filters by the column of the parent kind", () => {
    expect(parentColumn({ kind: "watch", id: "w" })).toBe("watch_item_id")
    expect(parentColumn({ kind: "idea", id: "i" })).toBe("idea_id")
  })
})
