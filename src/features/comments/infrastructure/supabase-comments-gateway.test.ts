import { describe, expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
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

function stub(reply: { data: unknown; error: unknown }) {
  const calls: unknown[][] = []
  const query = {
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(reply).then(resolve),
  } as Record<string, unknown>
  for (const name of ["select", "eq", "or", "order", "limit"])
    query[name] = (...args: unknown[]) => {
      calls.push([name, ...args])
      return query
    }
  const db = { from: vi.fn(() => query), rpc: vi.fn(async () => reply) }
  return { calls, db, gateway: new SupabaseCommentsGateway(db as unknown as Db) }
}

describe("SupabaseCommentsGateway", () => {
  it("lists one parent newest first, after the cursor, one page at a time", async () => {
    const { calls, db, gateway } = stub({ data: [ROW], error: null })
    const parent = { kind: "watch", id: "w" } as const
    const listed = await gateway.list({ spaceId: "s", parent, after: CURSOR, size: 2 })
    expect(listed).toMatchObject({ ok: true, value: [{ id: "c2", mentionIds: ["b"] }] })
    expect(db.from).toHaveBeenCalledWith("comments")
    expect(calls.slice(1)).toEqual([
      ["eq", "space_id", "s"],
      ["eq", "watch_item_id", "w"],
      ["or", expect.stringContaining('created_at.lt."2026-10-15T09:00:00+00:00"')],
      ["order", "created_at", { ascending: false }],
      ["order", "id", { ascending: false }],
      ["limit", 2],
    ])
  })

  it("posts through the RPC and keeps the mentions it sent", async () => {
    const { db, gateway } = stub({ data: ROW, error: null })
    const input = {
      spaceId: "s",
      parent: { kind: "idea", id: "i" } as const,
      body: "Hi",
      spoiler: true,
      mentionIds: ["z"],
    }
    expect(await gateway.post(input)).toMatchObject({ ok: true, value: { mentionIds: ["z"] } })
    expect(db.rpc).toHaveBeenCalledWith("post_comment", {
      target_space: "s",
      parent_kind: "idea",
      parent_id: "i",
      body: "Hi",
      spoiler: true,
      mention_ids: ["z"],
    })
  })

  it("edits and deletes through the RPCs", async () => {
    const { db, gateway } = stub({ data: ROW, error: null })
    expect(await gateway.edit("c2", "New", true)).toMatchObject({ ok: true })
    expect(db.rpc).toHaveBeenCalledWith("edit_comment", {
      target: "c2",
      new_body: "New",
      new_spoiler: true,
    })
    expect(await gateway.remove("c2")).toEqual({ ok: true, value: undefined })
    expect(db.rpc).toHaveBeenLastCalledWith("delete_comment", { target: "c2" })
  })

  it("maps database refusals to a denied AppError", async () => {
    const { gateway } = stub({ data: null, error: DENIED })
    expect(await gateway.remove("c2")).toMatchObject({ ok: false, error: { kind: "denied" } })
    expect(await gateway.edit("c2", "x", false)).toMatchObject({ error: { kind: "denied" } })
  })
})
