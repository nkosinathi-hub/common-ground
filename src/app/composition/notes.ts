import type { SessionStore } from "@/features/auth"
import { NotesService, provideNotes } from "@/features/notes"
import { SupabaseNoteArrivals } from "@/features/notes/infrastructure/supabase-note-arrivals"
import { SupabaseNotes } from "@/features/notes/infrastructure/supabase-notes"
import type { MemberDirectory } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"

export function composeNotes(db: Db, members: MemberDirectory) {
  return {
    service: new NotesService(new SupabaseNotes(db), members, () => new Date()),
    // A note or note_reply notification for the signed-in member reloads the Home card.
    arrivals: new SupabaseNoteArrivals(db),
  }
}

export function provideNotesFeature(
  notes: ReturnType<typeof composeNotes>,
  session: SessionStore,
): void {
  provideNotes({ ...notes, me: () => session.user?.id ?? "" })
}
