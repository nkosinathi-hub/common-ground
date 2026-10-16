import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { HOME_COLUMNS } from "./note-rows"
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
const home = {
  ...note,
  space_note_replies: [{ count: 2 }],
  space_note_reads: [{ read_at: AT }],
  latest: [{ created_at: "2026-10-16T10:00:00Z" }],
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, notes: new SupabaseNotes(client as Db) }
}

describe("SupabaseNotes home", () => {
  it("lists live notes pinned first, newest next, with counts and the caller's read", async () => {
    const { calls, notes } = setup({ data: [home], error: null })
    const page = await notes.home("s1", null, AT)
    expect(page).toMatchObject({
      ok: true,
      value: {
        items: [
          {
            id: "n1",
            recipientId: "ben",
            replyCount: 2,
            readAt: AT,
            lastReplyAt: "2026-10-16T10:00:00Z",
          },
        ],
        next: null,
      },
    })
    expect(calls).toEqual([
      ["from", "space_notes"],
      ["select", HOME_COLUMNS],
      ["eq", "space_id", "s1"],
      ["or", `expires_at.is.null,expires_at.gt."${AT}"`],
      ["order", "created_at", { referencedTable: "latest", ascending: false }],
      ["limit", 1, { referencedTable: "latest" }],
      ["order", "pinned", { ascending: false }],
      ["order", "created_at", { ascending: false }],
      ["order", "id", { ascending: false }],
      ["limit", 5],
    ])
  })

  it("continues after a pinned cursor, and gives the next one on a full page", async () => {
    const { calls, notes } = setup({ data: Array(5).fill(home), error: null })
    const page = await notes.home("s1", { pinned: true, createdAt: AT, id: "n9" }, AT)
    expect(page.ok && page.value.next).toEqual({ pinned: true, createdAt: AT, id: "n1" })
    const older = `created_at.lt."${AT}",and(created_at.eq."${AT}",id.lt.n9)`
    const live = `or(expires_at.is.null,expires_at.gt."${AT}")`
    expect(calls[3]).toEqual([
      "or",
      `and(${live},or(pinned.eq.false,and(pinned.eq.true,or(${older}))))`,
    ])
    const unpinned = setup({ data: [], error: null })
    await unpinned.notes.home("s1", { pinned: false, createdAt: AT, id: "n9" }, AT)
    expect(unpinned.calls[3]).toEqual(["or", `and(${live},and(pinned.eq.false,or(${older})))`])
  })
})
