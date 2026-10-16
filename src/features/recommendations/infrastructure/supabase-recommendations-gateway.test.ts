import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseRecommendationsGateway } from "./supabase-recommendations-gateway"

const ROW = {
  id: "r2",
  space_id: "s",
  watch_item_id: "w",
  note: null,
  created_at: "2026-10-15T10:00:00+00:00",
  item: { title: "Dune" },
  sender: null,
}
const CURSOR = { createdAt: "2026-10-15T09:00:00+00:00", id: "r1" }

function setup(reply: Reply, userId: string | null = "me") {
  const { calls, client } = recordingClient(reply, userId)
  return { calls, gateway: new SupabaseRecommendationsGateway(client as Db) }
}

describe("SupabaseRecommendationsGateway", () => {
  it("reads my pending inbox after the cursor and names missing senders null", async () => {
    const { calls, gateway } = setup({ data: [ROW], error: null })
    const inbox = await gateway.inbox({ spaceId: "s", after: CURSOR })
    const item = {
      id: "r2",
      createdAt: ROW.created_at,
      spaceId: "s",
      itemId: "w",
      itemTitle: "Dune",
      senderName: null,
      note: null,
      status: "pending",
    }
    expect(inbox).toEqual({ ok: true, value: { items: [item], next: null } })
    expect(calls.slice(2, 6)).toEqual([
      ["eq", "space_id", "s"],
      ["eq", "recipient_id", "me"],
      ["eq", "status", "pending"],
      ["or", expect.stringContaining("id.lt.r1")],
    ])
    expect(calls.at(-1)).toEqual(["limit", 51])
  })

  it("asks a signed-out caller to sign in without querying", async () => {
    const { calls, gateway } = setup({ data: [], error: null }, null)
    const inbox = await gateway.inbox({ spaceId: "s", after: null })
    expect(inbox).toMatchObject({ ok: false, error: { kind: "unauthenticated" } })
    expect(calls).toEqual([])
  })

  it("recommends and responds through the RPCs, sending no note as empty", async () => {
    const { calls, gateway } = setup({ data: ["r9"], error: null })
    const sent = await gateway.recommend({ itemId: "w", recipientIds: ["z"], note: null })
    expect(sent).toEqual({ ok: true, value: ["r9"] })
    expect((await gateway.respond("r9", "dismissed")).ok).toBe(true)
    expect(calls).toEqual([
      ["rpc", "recommend", { item: "w", recipient_ids: ["z"], note: "" }],
      ["rpc", "respond_recommendation", { target: "r9", response: "dismissed" }],
    ])
  })

  it("passes the RPC's validation message through", async () => {
    const duplicate = {
      code: "P0001",
      message: "That member already has this recommendation waiting",
    }
    const { gateway } = setup({ data: null, error: duplicate })
    const sent = await gateway.recommend({ itemId: "w", recipientIds: ["z"], note: "Go" })
    expect(sent).toEqual({ ok: false, error: { kind: "validation", message: duplicate.message } })
  })
})
