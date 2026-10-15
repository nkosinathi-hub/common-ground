import { describe, expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
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
const SIGNED_IN = { data: { user: { id: "me" } } }

function stub(reply: { data: unknown; error: unknown }, auth: unknown = SIGNED_IN) {
  const calls: unknown[][] = []
  const query = {
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(reply).then(resolve),
  } as Record<string, unknown>
  for (const name of ["select", "eq", "or", "order", "limit"])
    query[name] = (...args: unknown[]) => {
      calls.push([name, ...args])
      return query
    }
  const db = {
    auth: { getUser: async () => auth },
    from: vi.fn(() => query),
    rpc: vi.fn(async () => reply),
  }
  return { calls, db, gateway: new SupabaseRecommendationsGateway(db as unknown as Db) }
}

describe("SupabaseRecommendationsGateway", () => {
  it("reads my pending inbox after the cursor and names missing senders null", async () => {
    const { calls, gateway } = stub({ data: [ROW], error: null })
    const inbox = await gateway.inbox({ spaceId: "s", after: CURSOR, size: 2 })
    expect(inbox).toEqual({
      ok: true,
      value: [
        {
          id: "r2",
          createdAt: ROW.created_at,
          spaceId: "s",
          itemId: "w",
          itemTitle: "Dune",
          senderName: null,
          note: null,
          status: "pending",
        },
      ],
    })
    expect(calls.slice(1, 5)).toEqual([
      ["eq", "space_id", "s"],
      ["eq", "recipient_id", "me"],
      ["eq", "status", "pending"],
      ["or", expect.stringContaining("id.lt.r1")],
    ])
    expect(calls.at(-1)).toEqual(["limit", 2])
  })

  it("asks a signed-out caller to sign in without querying", async () => {
    const { db, gateway } = stub({ data: [], error: null }, { data: { user: null } })
    const inbox = await gateway.inbox({ spaceId: "s", after: null, size: 2 })
    expect(inbox).toMatchObject({ ok: false, error: { kind: "unauthenticated" } })
    expect(db.from).not.toHaveBeenCalled()
  })

  it("recommends and responds through the RPCs, sending no note as empty", async () => {
    const { db, gateway } = stub({ data: ["r9"], error: null })
    const sent = await gateway.recommend({ itemId: "w", recipientIds: ["z"], note: null })
    expect(sent).toEqual({ ok: true, value: ["r9"] })
    expect(db.rpc).toHaveBeenCalledWith("recommend", { item: "w", recipient_ids: ["z"], note: "" })
    expect(await gateway.respond("r9", "dismissed")).toEqual({ ok: true, value: undefined })
    expect(db.rpc).toHaveBeenLastCalledWith("respond_recommendation", {
      target: "r9",
      response: "dismissed",
    })
  })

  it("passes the RPC's validation message through", async () => {
    const duplicate = {
      code: "P0001",
      message: "That member already has this recommendation waiting",
    }
    const { gateway } = stub({ data: null, error: duplicate })
    const sent = await gateway.recommend({ itemId: "w", recipientIds: ["z"], note: "Go" })
    expect(sent).toEqual({ ok: false, error: { kind: "validation", message: duplicate.message } })
  })
})
