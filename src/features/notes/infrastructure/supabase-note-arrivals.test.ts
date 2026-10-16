import { describe, expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseNoteArrivals } from "./supabase-note-arrivals"

describe("SupabaseNoteArrivals", () => {
  it("listens for the caller's note and note_reply notifications, and stops", () => {
    const { calls, client } = recordingClient({ data: null, error: null })
    const onArrival = vi.fn()
    const stop = new SupabaseNoteArrivals(client as Db).subscribe(onArrival)
    expect(calls[0]?.[0]).toBe("channel")
    expect(calls[1]).toEqual([
      "on",
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "type=in.(note,note_reply)",
      },
      onArrival,
    ])
    expect(calls[2]).toEqual(["subscribe"])
    stop()
    expect(calls.at(-1)?.[0]).toBe("removeChannel")
  })
})
