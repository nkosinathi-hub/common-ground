import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import type { AttachmentsStore } from "../_shared/attachments/ports.ts"
import type { AttachmentRow } from "../_shared/attachments/types.ts"

const COLUMNS =
  "id, space_id, idea_id, uploader_id, object_path, filename, declared_mime, bytes, status, created_at"

type Row = Record<string, unknown>

const toRow = (r: Row): AttachmentRow => ({
  id: String(r.id),
  spaceId: String(r.space_id),
  ideaId: String(r.idea_id),
  uploaderId: r.uploader_id ? String(r.uploader_id) : null,
  objectPath: String(r.object_path),
  filename: String(r.filename),
  declaredMime: r.declared_mime as AttachmentRow["declaredMime"],
  bytes: Number(r.bytes),
  status: r.status as AttachmentRow["status"],
  createdAt: String(r.created_at),
})

const fail = (what: string): never => {
  throw new Error(`${what} failed`)
}

/** public.attachments through the service-role client (writes have no client grants). */
export function createStore(admin: SupabaseClient): AttachmentsStore {
  const table = () => admin.from("attachments")

  return {
    async ideaInSpace(spaceId, ideaId) {
      const { data, error } = await admin
        .from("ideas")
        .select("id")
        .eq("space_id", spaceId)
        .eq("id", ideaId)
        .maybeSingle()
      return error ? fail("idea lookup") : data !== null
    },

    async createPending(upload) {
      const { data, error } = await table()
        .insert({
          space_id: upload.spaceId,
          idea_id: upload.ideaId,
          uploader_id: upload.uploaderId,
          filename: upload.filename,
          declared_mime: upload.mime,
          bytes: upload.bytes,
        })
        .select(COLUMNS)
        .single()
      return error || !data ? fail("attachment insert") : toRow(data)
    },

    async find(attachmentId) {
      const { data, error } = await table().select(COLUMNS).eq("id", attachmentId).maybeSingle()
      if (error) return fail("attachment lookup")
      return data ? toRow(data) : null
    },

    async markReady(attachmentId, mime) {
      const { data, error } = await table()
        .update({ status: "ready", verified_mime: mime, finalized_at: new Date().toISOString() })
        .eq("id", attachmentId)
        .eq("status", "pending")
        .select(COLUMNS)
        .maybeSingle()
      if (error) return fail("attachment finalize")
      return data ? toRow(data) : null
    },

    async markRejected(attachmentId) {
      const { error } = await table()
        .update({ status: "rejected", finalized_at: new Date().toISOString() })
        .eq("id", attachmentId)
      if (error) fail("attachment reject")
    },

    async cleanupCandidates() {
      const { data, error } = await admin.rpc("cleanup_candidates")
      if (error) return fail("cleanup listing")
      return ((data ?? []) as Row[]).map((r) => ({
        attachmentId: r.attachment_id ? String(r.attachment_id) : null,
        objectPath: String(r.object_path),
      }))
    },

    async deleteRows(attachmentIds) {
      const { error } = await table()
        .delete()
        .in("id", [...attachmentIds])
      if (error) fail("attachment delete")
    },
  }
}
