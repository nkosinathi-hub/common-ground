import { appError, err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type {
  AttachmentsGateway,
  Disposition,
  StartRequest,
  StartedUpload,
} from "../application/ports"
import type { Attachment } from "../domain/types"
import { toAttachmentsError } from "./attachments-errors"

type DbError = { code?: string; message?: string; status?: number }
type Reply = { data: unknown; error: DbError | null }
interface Query extends PromiseLike<Reply> {
  eq(column: string, value: string): Query
  order(column: string, options?: { ascending: boolean }): Query
}

/**
 * The slice of the Supabase client this adapter uses. Structural, because the generated
 * database types do not include attachments until they are regenerated after the migration.
 */
export interface AttachmentsDb {
  functions: {
    invoke(name: string, options: { body: Record<string, unknown> }): Promise<Reply>
  }
  from(table: string): { select(columns: string): Query }
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<Reply>
}

type Row = Record<string, unknown>
const COLUMNS = "id, space_id, idea_id, uploader_id, filename, verified_mime, bytes, created_at"

const toAttachment = (r: Row): Attachment => ({
  id: String(r.id),
  spaceId: String(r.space_id),
  ideaId: String(r.idea_id),
  uploaderId: r.uploader_id ? String(r.uploader_id) : null,
  filename: String(r.filename),
  mime: r.verified_mime as Attachment["mime"],
  bytes: Number(r.bytes),
  createdAt: String(r.created_at),
})

/** Edge Function for upload and signed URLs; RLS reads and the delete RPC for the rest. */
export class SupabaseAttachmentsGateway implements AttachmentsGateway {
  constructor(private readonly db: AttachmentsDb) {}

  private async invoke<T>(body: Record<string, unknown>): Promise<Result<T>> {
    try {
      const { data, error } = await this.db.functions.invoke("attachments", { body })
      if (error) return err(await toAttachmentsError(error))
      return ok(data as T)
    } catch {
      return err(appError("network", "Attachments are unavailable right now. Try again"))
    }
  }

  async list(spaceId: string, ideaId: string): Promise<Result<Attachment[]>> {
    const { data, error } = await this.db
      .from("attachments")
      .select(COLUMNS)
      .eq("space_id", spaceId)
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true })
    if (error) return err(toAppError(error))
    return ok(((data ?? []) as Row[]).map(toAttachment))
  }

  start = (request: StartRequest) => this.invoke<StartedUpload>({ action: "start", ...request })

  finalize = (attachmentId: string) => this.invoke<Attachment>({ action: "finalize", attachmentId })

  async signedUrl(attachmentId: string, disposition: Disposition): Promise<Result<string>> {
    const reply = await this.invoke<{ url: string }>({
      action: "download",
      attachmentId,
      disposition,
    })
    return reply.ok ? ok(reply.value.url) : reply
  }

  async remove(attachmentId: string): Promise<Result<void>> {
    const { error } = await this.db.rpc("delete_attachment", { target: attachmentId })
    return error ? err(toAppError(error)) : ok(undefined)
  }
}
