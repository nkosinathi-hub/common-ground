import type { SupabaseClient } from "@supabase/supabase-js"
import type { PushStore, PushTarget } from "../_shared/push/ports.ts"

type Row = Record<string, unknown>

const toTarget = (r: Row): PushTarget => ({
  token: String(r.token),
  spaceId: String(r.space_id),
  type: String(r.type),
  subjectType: String(r.subject_type),
  subjectId: String(r.subject_id),
  actorName: typeof r.actor_name === "string" ? r.actor_name : null,
})

/** Notification targets and stale tokens through the service-role client. Never logs tokens. */
export function createPushStore(admin: SupabaseClient): PushStore {
  return {
    async targets(notificationId) {
      const { data, error } = await admin.rpc("push_targets", {
        target_notification: notificationId,
      })
      if (error) throw new Error("push target lookup failed")
      return ((data ?? []) as Row[]).map(toTarget)
    },

    async forget(tokens) {
      const { error } = await admin
        .from("push_devices")
        .delete()
        .in("token", [...tokens])
      if (error) throw new Error("push device removal failed")
    },
  }
}
