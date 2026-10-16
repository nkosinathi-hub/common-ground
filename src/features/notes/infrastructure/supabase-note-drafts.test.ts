import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { DRAFT_COLUMNS, SupabaseNoteDrafts } from "./supabase-note-drafts"

const AT = "2026-10-16T09:00:00Z"
const row = {
  id: "d1",
  space_id: "s1",
  recipient_id: "ben",
  sections: { happened: "Sunday" },
  response_wish: "any",
  support_wish: null,
  updated_at: AT,
}
const fields = {
  recipientId: "ben",
  sections: { happened: "Sunday" },
  responseWish: "any",
  supportWish: null,
} as const
const columns = {
  recipient_id: "ben",
  sections: fields.sections,
  response_wish: "any",
  support_wish: null,
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, drafts: new SupabaseNoteDrafts(client as Db) }
}

describe("SupabaseNoteDrafts", () => {
  it("lists my drafts in a space, most recently edited first", async () => {
    const { calls, drafts } = setup({ data: [row], error: null })
    expect(await drafts.list("s1")).toEqual({
      ok: true,
      value: [{ id: "d1", spaceId: "s1", ...fields, updatedAt: AT }],
    })
    expect(calls).toEqual([
      ["from", "space_note_drafts"],
      ["select", DRAFT_COLUMNS],
      ["eq", "space_id", "s1"],
      ["order", "updated_at", { ascending: false }],
    ])
  })

  it("creates, updates and deletes directly, and sends through send_note_draft", async () => {
    const { calls, drafts } = setup({ data: row, error: null })
    expect(await drafts.create("s1", fields)).toMatchObject({ ok: true, value: { id: "d1" } })
    expect(await drafts.update("d1", fields)).toMatchObject({ ok: true, value: { id: "d1" } })
    await drafts.remove("d1")
    expect(calls).toEqual([
      ["from", "space_note_drafts"],
      ["insert", { space_id: "s1", ...columns }],
      ["select", DRAFT_COLUMNS],
      ["single"],
      ["from", "space_note_drafts"],
      ["update", columns],
      ["eq", "id", "d1"],
      ["select", DRAFT_COLUMNS],
      ["single"],
      ["from", "space_note_drafts"],
      ["delete"],
      ["eq", "id", "d1"],
    ])
    const note = { id: "n1", space_id: "s1", author_id: "ana", recipient_id: "ben", body: "" }
    const sent = setup({
      data: {
        ...note,
        pinned: false,
        expires_at: null,
        created_at: AT,
        updated_at: AT,
        kind: "hard_talk",
        sections: [],
        response_wish: "any",
        support_wish: null,
      },
      error: null,
    })
    expect(await sent.drafts.send("d1")).toMatchObject({
      ok: true,
      value: { id: "n1", kind: "hard_talk", sections: {}, readAt: AT },
    })
    expect(sent.calls).toEqual([["rpc", "send_note_draft", { draft: "d1" }]])
  })
})
