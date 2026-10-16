import type { Result } from "@/shared/domain"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CollaboratorsRepository } from "../application/ports"
import type { Collaborator } from "../domain"
import { COLLABORATOR_COLUMNS, toCollaborator } from "./idea-row"

export class SupabaseCollaborators implements CollaboratorsRepository {
  constructor(private readonly db: Db) {}

  list(ideaId: string): Promise<Result<Collaborator[]>> {
    const query = this.db.from("idea_collaborators").select(COLLABORATOR_COLUMNS)
    return settle(query.eq("idea_id", ideaId).order("invited_at"), (rows) =>
      rows.map(toCollaborator),
    )
  }

  invite(ideaId: string, userId: string): Promise<Result<void>> {
    return done(this.db.rpc("invite_idea_collaborator", { idea: ideaId, member: userId }))
  }

  respond(ideaId: string, accept: boolean): Promise<Result<void>> {
    return done(this.db.rpc("respond_idea_invite", { idea: ideaId, accept }))
  }

  remove(ideaId: string, userId: string): Promise<Result<void>> {
    return done(this.db.rpc("remove_idea_collaborator", { idea: ideaId, member: userId }))
  }
}
