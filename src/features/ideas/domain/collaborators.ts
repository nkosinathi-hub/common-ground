import type { Idea } from "./idea"

/** Someone invited onto an idea. acceptedAt null means the invite is still pending. */
export interface Collaborator {
  readonly userId: string
  readonly invitedBy: string | null
  readonly invitedAt: string
  readonly acceptedAt: string | null
}

type WithPeople = Pick<Idea, "createdBy" | "collaborators">

const accepted = (idea: WithPeople) =>
  idea.collaborators.filter((c) => c.acceptedAt !== null).map((c) => c.userId)

/** The idea's people: its author (unless they left) and everyone who accepted. */
export const peopleOf = (idea: WithPeople): string[] =>
  idea.createdBy ? [idea.createdBy, ...accepted(idea)] : accepted(idea)

/** Mirrors the server's `ours`: the viewer started it or accepted an invite to it. */
export const isOurs = (idea: WithPeople, me: string): boolean =>
  me !== "" && peopleOf(idea).includes(me)

/** "Our idea": more than one person is on it. */
export const isShared = (idea: WithPeople): boolean => peopleOf(idea).length > 1

export const invitationFor = (idea: WithPeople, me: string): Collaborator | null =>
  idea.collaborators.find((c) => c.userId === me && c.acceptedAt === null) ?? null

/** From the members picked in the dialog: who needs an invite and who comes off the idea. */
export function rosterChanges(idea: WithPeople, picked: ReadonlySet<string>) {
  const current = new Set(idea.collaborators.map((c) => c.userId))
  const invite = [...picked].filter((id) => id !== idea.createdBy && !current.has(id))
  const remove = [...current].filter((id) => !picked.has(id))
  return { invite, remove }
}
