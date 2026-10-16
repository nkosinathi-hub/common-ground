import type { Db } from "@/shared/infrastructure/supabase"
import type { NoteArrivals } from "../application/ports"

/** Realtime inserts into the caller's own notifications (RLS) of the note kinds. */
export class SupabaseNoteArrivals implements NoteArrivals {
  constructor(private readonly db: Db) {}

  subscribe(onArrival: () => void): () => void {
    const change = {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: "type=in.(note,note_reply,hard_talk,note_response)",
    } as const
    const channel = this.db
      .channel(`note-arrivals-${crypto.randomUUID()}`)
      .on("postgres_changes", change, onArrival)
      .subscribe()
    return () => {
      // Fire and forget: the channel is gone for this client either way.
      void this.db.removeChannel(channel)
    }
  }
}
