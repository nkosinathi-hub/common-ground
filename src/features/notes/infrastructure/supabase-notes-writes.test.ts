import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { REPLY_COLUMNS } from "./note-rows"
import { SupabaseNotes } from "./supabase-notes"

const AT = "2026-10-16T09:00:00Z"
const note = {
  id: "n1",
  space_id: "s1",
  author_id: "ana",
  recipient_id: "ben",
  body: "Hi",
  pinned: true,
  expires_at: null,
  created_at: AT,
  updated_at: AT,
}
const reply = { id: "r1", note_id: "n1", author_id: "ben", body: "Yes", created_at: AT }

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, notes: new SupabaseNotes(client as Db) }
}

describe("SupabaseNotes writes", () => {
  it("posts through post_note and reads the new note as already read by its author", async () => {
    const { calls, notes } = setup({ data: note, error: null })
    const input = { spaceId: "s1", recipientId: null, body: "Hi", pinned: false, expiresAt: null }
    const posted = await notes.post(input)
    expect(posted).toMatchObject({ ok: true, value: { id: "n1", readAt: AT, replyCount: 0 } })
    expect(calls).toEqual([
      [
        "rpc",
        "post_note",
        { target_space: "s1", recipient: null, body: "Hi", pinned: false, expires_at: null },
      ],
    ])
  })

  it("replies, lists the thread oldest first and marks read", async () => {
    const { calls, notes } = setup({ data: reply, error: null })
    expect(await notes.reply("n1", "Yes")).toMatchObject({
      ok: true,
      value: { noteId: "n1", authorId: "ben" },
    })
    await notes.markRead("n1")
    const list = setup({ data: [reply], error: null })
    expect(await list.notes.thread("n1")).toMatchObject({ ok: true, value: [{ id: "r1" }] })
    expect([...calls, ...list.calls]).toEqual([
      ["rpc", "reply_to_note", { note: "n1", body: "Yes" }],
      ["rpc", "mark_note_read", { note: "n1" }],
      ["from", "space_note_replies"],
      ["select", REPLY_COLUMNS],
      ["eq", "note_id", "n1"],
      ["order", "created_at"],
      ["order", "id"],
      ["limit", 200],
    ])
  })
})
