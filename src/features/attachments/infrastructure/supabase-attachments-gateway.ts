import { appError, err, ok, type Result } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type {
  AttachmentsGateway,
  Disposition,
  StartRequest,
  StartedUpload,
} from "../application/ports"
import { isAttachmentMime } from "../domain/rules"
import type { Attachment } from "../domain/types"
import { toAttachmentsError } from "./attachments-errors"

type AttachmentRow = Pick<
  Tables<"attachments">,
  | "id"
  | "space_id"
  | "idea_id"
  | "uploader_id"
  | "filename"
  | "verified_mime"
  | "bytes"
  | "created_at"
>

const COLUMNS = "id, space_id, idea_id, uploader_id, filename, verified_mime, bytes, created_at"

/** RLS shows verified rows only; a row without an allowed verified type is skipped anyway. */
function toAttachment(row: AttachmentRow): Attachment | null {
  const mime = row.verified_mime
  if (!mime || !isAttachmentMime(mime)) return null
  return {
    id: row.id,
    spaceId: row.space_id,
    ideaId: row.idea_id,
    uploaderId: row.uploader_id,
    filename: row.filename,
    mime,
    bytes: row.bytes,
    createdAt: row.created_at,
  }
}

const toAttachments = (rows: readonly AttachmentRow[]): Attachment[] =>
  rows.map(toAttachment).filter((attachment) => attachment !== null)

/** Edge Function for upload and signed URLs; RLS reads and the delete RPC for the rest. */
export class SupabaseAttachmentsGateway implements AttachmentsGateway {
  constructor(private readonly db: Db) {}

  private async invoke<T>(body: Record<string, unknown>): Promise<Result<T>> {
    try {
      const { data, error } = await this.db.functions.invoke<T>("attachments", { body })
      if (error) return err(await toAttachmentsError(error))
      return ok(data as T)
    } catch {
      return err(appError("network", "Attachments are unavailable right now. Try again"))
    }
  }

  list(spaceId: string, ideaId: string): Promise<Result<Attachment[]>> {
    const query = this.db
      .from("attachments")
      .select(COLUMNS)
      .eq("space_id", spaceId)
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true })
    return settle(query, toAttachments)
  }

  start = (request: StartRequest) => this.invoke<StartedUpload>({ action: "start", ...request })

  finalize = (attachmentId: string) => this.invoke<Attachment>({ action: "finalize", attachmentId })

  async signedUrl(attachmentId: string, disposition: Disposition): Promise<Result<string>> {
    const body = { action: "download", attachmentId, disposition }
    const reply = await this.invoke<{ url: string }>(body)
    return reply.ok ? ok(reply.value.url) : reply
  }

  remove(attachmentId: string): Promise<Result<void>> {
    return done(this.db.rpc("delete_attachment", { target: attachmentId }))
  }
}
