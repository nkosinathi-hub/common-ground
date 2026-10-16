import { appError, err, ok, type MemberRef, type Result } from "@/shared/domain"
import type { CollaboratorsRepository } from "../application/ports"
import type { Collaborator, Idea } from "../domain"
import type { InMemoryIdeas } from "./in-memory-ideas"

const NOW = "2026-10-16T09:00:00.000Z"

/** Keeps invites on the in-memory ideas, with the server's member and author checks. */
export class InMemoryCollaborators implements CollaboratorsRepository {
  /** The signed-in user who invites, answers and removes. */
  me = "ana"

  constructor(
    private readonly ideas: InMemoryIdeas,
    private readonly members: () => readonly MemberRef[],
  ) {}

  private change(ideaId: string, edit: (list: readonly Collaborator[]) => Collaborator[] | null) {
    const idea = this.ideas.rows.get(ideaId)
    const next = idea ? edit(idea.collaborators) : null
    if (!idea || !next) return err(appError("not_found", "No such invite"))
    this.ideas.rows.set(ideaId, { ...idea, collaborators: next } satisfies Idea)
    return ok(undefined)
  }

  async list(ideaId: string): Promise<Result<Collaborator[]>> {
    const idea = this.ideas.rows.get(ideaId)
    return idea ? ok([...idea.collaborators]) : err(appError("not_found", "Idea not found"))
  }

  async invite(ideaId: string, userId: string): Promise<Result<void>> {
    const idea = this.ideas.rows.get(ideaId)
    if (!this.members().some((m) => m.id === userId) || idea?.createdBy === userId) {
      return err(appError("validation", "invite another member of this space"))
    }
    const invite = { userId, invitedBy: this.me, invitedAt: NOW, acceptedAt: null }
    return this.change(ideaId, (list) =>
      list.some((c) => c.userId === userId) ? [...list] : [...list, invite],
    )
  }

  async respond(ideaId: string, accept: boolean): Promise<Result<void>> {
    return this.change(ideaId, (list) => {
      if (!list.some((c) => c.userId === this.me && !c.acceptedAt)) return null
      if (!accept) return list.filter((c) => c.userId !== this.me)
      return list.map((c) => (c.userId === this.me ? { ...c, acceptedAt: NOW } : c))
    })
  }

  async remove(ideaId: string, userId: string): Promise<Result<void>> {
    return this.change(ideaId, (list) =>
      list.some((c) => c.userId === userId) ? list.filter((c) => c.userId !== userId) : null,
    )
  }
}
