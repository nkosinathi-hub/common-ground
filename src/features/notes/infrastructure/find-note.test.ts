import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { AT, NOTE_ROW } from "../testing/note-row"
import { findNote } from "./find-note"

describe("note deep links", () => {
  it("uses the RLS table, scopes both space and id, and excludes expired notes", async () => {
    const { client, calls } = recordingClient({
      data: [
        { ...NOTE_ROW, responses: [], space_note_replies: [], space_note_reads: [], latest: [] },
      ],
      error: null,
    })
    expect(await findNote(client as Db, "s1", "n1", AT)).toMatchObject({
      ok: true,
      value: { id: "n1" },
    })
    expect(calls).toContainEqual(["from", "space_notes"])
    expect(calls).toContainEqual(["eq", "space_id", "s1"])
    expect(calls).toContainEqual(["eq", "id", "n1"])
    expect(calls).toContainEqual(["or", `expires_at.is.null,expires_at.gt."${AT}"`])
    expect(calls.at(-1)).toEqual(["limit", 1])
  })
  it("handles deleted, inaccessible and expired notes as unavailable", async () => {
    const { client } = recordingClient({ data: [], error: null })
    expect(await findNote(client as Db, "s", "gone", AT)).toMatchObject({
      ok: false,
      error: { kind: "not_found" },
    })
  })
})
