import { ok, type MemberDirectory, type MemberRef } from "@/shared/domain"
import { DraftsService } from "../application/drafts-service"
import { HardTalkService } from "../application/hard-talk-service"
import { NotesService } from "../application/notes-service"
import { InMemoryDrafts, InMemoryHardTalk } from "./in-memory-hard-talk"
import { InMemoryNotes } from "./in-memory-notes"

export const MEMBERS: MemberRef[] = [
  { id: "ana", displayName: "Ana" },
  { id: "ben", displayName: "Ben" },
  { id: "cy", displayName: "Cy" },
]

/** Notes services over in-memory stores and members, with the clock at 16 Oct 2026 09:00 UTC. */
export function inMemoryNotesService(members: MemberRef[] = MEMBERS) {
  const repo = new InMemoryNotes()
  const directory: MemberDirectory = { members: async () => ok(members) }
  const clock = () => new Date("2026-10-16T09:00:00.000Z")
  const draftsRepo = new InMemoryDrafts(repo)
  const hardTalkRepo = new InMemoryHardTalk(repo)
  return {
    repo,
    draftsRepo,
    hardTalkRepo,
    service: new NotesService(repo, directory, clock),
    drafts: new DraftsService(draftsRepo, directory),
    hardTalk: new HardTalkService(hardTalkRepo, directory),
  }
}
