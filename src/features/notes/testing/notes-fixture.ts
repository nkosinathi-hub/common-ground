import { ok, type MemberDirectory, type MemberRef } from "@/shared/domain"
import { NotesService } from "../application/notes-service"
import { InMemoryNotes } from "./in-memory-notes"

export const MEMBERS: MemberRef[] = [
  { id: "ana", displayName: "Ana" },
  { id: "ben", displayName: "Ben" },
  { id: "cy", displayName: "Cy" },
]

/** A NotesService over in-memory notes and members, with the clock at 16 Oct 2026 09:00 UTC. */
export function inMemoryNotesService(members: MemberRef[] = MEMBERS) {
  const repo = new InMemoryNotes()
  const directory: MemberDirectory = { members: async () => ok(members) }
  const clock = () => new Date("2026-10-16T09:00:00.000Z")
  return { repo, service: new NotesService(repo, directory, clock) }
}
