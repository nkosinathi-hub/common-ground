import { done, same, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { AccountRepository } from "../application/ports"

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private readonly db: Db) {}

  exportSpace = (spaceId: string) =>
    settle(this.db.rpc("export_space", { target_space: spaceId }), same)

  exportMe = () => settle(this.db.rpc("export_me"), same)

  deleteMe = () => done(this.db.rpc("delete_my_account"))

  /** The session's name comes from auth metadata, so it changes with the profile (A7). */
  async updateDisplayName(userId: string, name: string) {
    const saved = await done(
      this.db.from("profiles").update({ display_name: name }).eq("id", userId),
    )
    if (!saved.ok) return saved
    return done(this.db.auth.updateUser({ data: { display_name: name } }))
  }
}
