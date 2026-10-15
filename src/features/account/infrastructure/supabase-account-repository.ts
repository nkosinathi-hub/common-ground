import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { AccountRepository } from "../application/ports"

const asIs = (data: unknown): unknown => data

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private readonly db: Db) {}

  exportSpace = (spaceId: string) =>
    settle(this.db.rpc("export_space", { target_space: spaceId }), asIs)

  exportMe = () => settle(this.db.rpc("export_me"), asIs)

  deleteMe = () => done(this.db.rpc("delete_my_account"))

  updateDisplayName = (userId: string, name: string) =>
    done(this.db.from("profiles").update({ display_name: name }).eq("id", userId))
}
