import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import type { CommentRow } from "./comment-row"
import { SupabaseCommentsGateway } from "./supabase-comments-gateway"

const ROW: CommentRow = {
  id: "c2",
  space_id: "s",
  watch_item_id: "w",
  idea_id: null,
  author_id: "a",
  body: "Hi",
  spoiler: false,
  edited: false,
  created_at: "2026-10-15T10:00:00+00:00",
  comment_mentions: [{ user_id: "b" }],
}
const DENIED = { code: "42501", message: "permission denied for table comments" }
const CURSOR = { createdAt: "2026-10-15T09:00:00+00:00", id: "c1" }

function setup(reply: Reply) {
  const { calls, client } = recordingClient(reply)
  return { calls, gateway: new SupabaseCommentsGateway(client as Db) }
}

describe("SupabaseCommentsGateway", () => {
  it("lists one parent newest first, after the cursor, one page at a time", async () => {
    const { calls, gateway } = setup({ data: [ROW], error: null })
    const parent = { kind: "watch", id: "w" } as const
    const listed = await gateway.list({ spaceId: "s", parent, after: CURSOR })
    expect(listed).toMatchObject({
      ok: true,
      value: { items: [{ id: "c2", mentionIds: ["b"] }], next: null },
    })
    expect(calls[0]).toEqual(["from", "comments"])
    expect(calls.slice(2)).toEqual([
      ["eq", "space_id", "s"],
      ["eq", "watch_item_id", "w"],
      ["or", expect.stringContaining('created_at.lt."2026-10-15T09:00:00+00:00"')],
      ["order", "created_at", { ascending: false }],
      ["order", "id", { ascending: false }],
      ["limit", 51],
    ])
  })

  it("posts through the RPC and keeps the mentions it sent", async () => {
    const { calls, gateway } = setup({ data: ROW, error: null })
    const input = {
      spaceId: "s",
      parent: { kind: "idea", id: "i" } as const,
      body: "Hi",
      spoiler: true,
      mentionIds: ["z"],
    }
    expect(await gateway.post(input)).toMatchObject({ ok: true, value: { mentionIds: ["z"] } })
    expect(calls).toEqual([
      [
        "rpc",
        "post_comment",
        {
          target_space: "s",
          parent_kind: "idea",
          parent_id: "i",
          body: "Hi",
          spoiler: true,
          mention_ids: ["z"],
        },
      ],
    ])
  })

  it("edits and deletes through the RPCs", async () => {
    const { calls, gateway } = setup({ data: ROW, error: null })
    expect(await gateway.edit("c2", "New", true)).toMatchObject({ ok: true })
    expect(await gateway.remove("c2")).toEqual({ ok: true, value: undefined })
    expect(calls).toEqual([
      ["rpc", "edit_comment", { target: "c2", new_body: "New", new_spoiler: true }],
      ["rpc", "delete_comment", { target: "c2" }],
    ])
  })

  it("maps database refusals to a denied AppError", async () => {
    const { gateway } = setup({ data: null, error: DENIED })
    expect(await gateway.remove("c2")).toMatchObject({ ok: false, error: { kind: "denied" } })
    expect(await gateway.edit("c2", "x", false)).toMatchObject({ error: { kind: "denied" } })
  })
})
