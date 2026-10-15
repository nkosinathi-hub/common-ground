import { err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { AccountRepository } from "../application/ports"

type Reply = { data: unknown; error: { code?: string; message?: string } | null }
type AccountRpc = "export_space" | "export_me" | "delete_my_account"
// The account RPCs are not in the generated types until `pnpm db:types` runs after this
// migration lands; the call shape below is the narrow contract until then.
type Rpc = (fn: AccountRpc, args?: Record<string, unknown>) => PromiseLike<Reply>

const unwrap = ({ data, error }: Reply): Result<unknown> =>
  error ? err(toAppError(error)) : ok(data)
const unit = ({ error }: Pick<Reply, "error">): Result<void> =>
  error ? err(toAppError(error)) : ok(undefined)

export class SupabaseAccountRepository implements AccountRepository {
  private readonly rpc: Rpc

  constructor(private readonly db: Db) {
    this.rpc = db.rpc.bind(db) as unknown as Rpc
  }

  exportSpace = async (spaceId: string) =>
    unwrap(await this.rpc("export_space", { target_space: spaceId }))

  exportMe = async () => unwrap(await this.rpc("export_me"))

  deleteMe = async () => unit(await this.rpc("delete_my_account"))

  updateDisplayName = async (userId: string, name: string) =>
    unit(await this.db.from("profiles").update({ display_name: name }).eq("id", userId))
}
