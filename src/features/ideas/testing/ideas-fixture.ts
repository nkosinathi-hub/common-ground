import { ok, type MemberDirectory, type MemberRef } from "@/shared/domain"
import { IdeasService } from "../application/ideas-service"
import { InMemoryCollaborators } from "./in-memory-collaborators"
import { InMemoryIdeas } from "./in-memory-ideas"

export const MEMBERS: MemberRef[] = [
  { id: "ana", displayName: "Ana" },
  { id: "ben", displayName: "Ben" },
  { id: "cy", displayName: "Cy" },
]

/** An IdeasService over in-memory ideas, invites and members, for tests. */
export function inMemoryIdeasService(members: MemberRef[] = MEMBERS) {
  const repo = new InMemoryIdeas()
  const people = new InMemoryCollaborators(repo, () => members)
  const directory: MemberDirectory = { members: async () => ok(members) }
  return { repo, people, service: new IdeasService(repo, people, directory) }
}
