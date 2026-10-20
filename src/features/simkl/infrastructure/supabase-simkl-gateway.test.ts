import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseSimklGateway } from "./supabase-simkl-gateway"

function recordingDb(replies: Reply | readonly Reply[]) {
  const { calls, client } = recordingClient(replies)
  return { calls, gateway: new SupabaseSimklGateway(client as Db) }
}

const httpError = (kind: string, message: string) => ({
  name: "FunctionsHttpError",
  context: { json: async () => ({ error: { kind, message } }) },
})

describe("SupabaseSimklGateway", () => {
  it("reads the caller's link without ever asking for the token", async () => {
    const row = { connected_at: "2026-03-01T10:00:00Z", last_synced_at: null }
    const { calls, gateway } = recordingDb({ data: row, error: null })
    expect(await gateway.status()).toEqual({
      ok: true,
      value: { connectedAt: "2026-03-01T10:00:00Z", lastSyncedAt: null },
    })
    expect(calls).toEqual([
      ["from", "simkl_links"],
      ["select", "connected_at, last_synced_at"],
      ["maybeSingle"],
    ])
  })

  it("reads no row, or a pending sign-in, as not connected", async () => {
    const pending = { connected_at: null, last_synced_at: null }
    expect(await recordingDb({ data: pending, error: null }).gateway.status()).toEqual({
      ok: true,
      value: null,
    })
    expect(await recordingDb({ data: null, error: null }).gateway.status()).toEqual({
      ok: true,
      value: null,
    })
  })

  it("calls the simkl function for each action", async () => {
    const pin = { userCode: "ABCD-EFGH", verificationUri: "https://simkl.com/pin" }
    const replies = [pin, { status: "connected" }, { added: 2 }, { connected: false }].map(
      (data) => ({
        data,
        error: null,
      }),
    )
    const { calls, gateway } = recordingDb(replies)
    expect(await gateway.startPin()).toEqual({ ok: true, value: pin })
    expect(await gateway.poll(5)).toEqual({ ok: true, value: { status: "connected" } })
    expect(await gateway.sync()).toEqual({ ok: true, value: { added: 2 } })
    expect(await gateway.disconnect()).toEqual({ ok: true, value: undefined })
    expect(calls.map((call) => (call[2] as { body: unknown }).body)).toEqual([
      { action: "pin" },
      { action: "poll", interval: 5 },
      { action: "sync" },
      { action: "disconnect" },
    ])
  })

  it("shows the function's own words when Simkl is not set up", async () => {
    const message = "Simkl import is not set up on this server yet"
    const { gateway } = recordingDb({
      data: null,
      error: httpError("unavailable", message) as never,
    })
    expect(await gateway.startPin()).toEqual({ ok: false, error: { kind: "network", message } })
  })
})
