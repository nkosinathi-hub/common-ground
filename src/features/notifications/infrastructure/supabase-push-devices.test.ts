import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { SupabasePushDevices } from "./supabase-push-devices"

describe("SupabasePushDevices", () => {
  it("registers and forgets this phone's FCM token through their RPCs", async () => {
    const { calls, client } = recordingClient({ data: null, error: null })
    const devices = new SupabasePushDevices(client as Db)
    expect(await devices.register("tok")).toEqual({ ok: true, value: undefined })
    expect(await devices.unregister("tok")).toEqual({ ok: true, value: undefined })
    expect(calls).toEqual([
      ["rpc", "register_push_device", { token: "tok", platform: "android" }],
      ["rpc", "unregister_push_device", { token: "tok" }],
    ])
  })

  it("reports a refusal instead of throwing", async () => {
    const { client } = recordingClient({ data: null, error: { code: "42501", message: "no" } })
    expect((await new SupabasePushDevices(client as Db).register("tok")).ok).toBe(false)
  })
})
