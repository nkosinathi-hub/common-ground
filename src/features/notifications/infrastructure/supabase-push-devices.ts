import { done } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { PushDevicesGateway } from "../application/ports"

/** This phone's FCM token, kept against the signed-in user so the push function can reach it. */
export class SupabasePushDevices implements PushDevicesGateway {
  constructor(private readonly db: Db) {}

  register = (token: string) =>
    done(this.db.rpc("register_push_device", { token, platform: "android" }))
  unregister = (token: string) => done(this.db.rpc("unregister_push_device", { token }))
}
