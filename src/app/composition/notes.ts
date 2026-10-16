import type { SessionStore } from "@/features/auth"
import { DraftsService, HardTalkService, NotesService, provideNotes } from "@/features/notes"
import { SupabaseHardTalk } from "@/features/notes/infrastructure/supabase-hard-talk"
import { SupabaseNoteArrivals } from "@/features/notes/infrastructure/supabase-note-arrivals"
import { SupabaseNoteDrafts } from "@/features/notes/infrastructure/supabase-note-drafts"
import { SupabaseNotes } from "@/features/notes/infrastructure/supabase-notes"
import { asAuthors, type MemberDirectory } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"

export function composeNotes(db: Db, members: MemberDirectory, authors = asAuthors(members)) {
  return {
    service: new NotesService(new SupabaseNotes(db), members, () => new Date(), authors),
    // "Something on my mind": the author's private drafts, and the reader's gentle responses.
    drafts: new DraftsService(new SupabaseNoteDrafts(db), authors),
    hardTalk: new HardTalkService(new SupabaseHardTalk(db), authors),
    // A note, reply, shared or response notification for the signed-in member reloads Home.
    arrivals: new SupabaseNoteArrivals(db),
  }
}

export function provideNotesFeature(
  notes: ReturnType<typeof composeNotes>,
  session: SessionStore,
): void {
  provideNotes({ ...notes, me: () => session.user?.id ?? "" })
}
