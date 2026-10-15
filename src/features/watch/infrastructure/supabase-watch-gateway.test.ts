import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { DEFAULT_FILTERS } from "../domain/filters"
import { SupabaseWatchGateway } from "./supabase-watch-gateway"
import { toWatchError } from "./watch-rows"

const row = {
  id: "i1",
  space_id: "s1",
  catalog_type: "tv",
  catalog_id: 9,
  title: "Show",
  media_type: "anime",
  release_year: null,
  synopsis: "",
  poster_path: "/p.jpg",
  shared_intent: "watch_together",
  manual_availability_note: null,
  created_by: "u1",
  created_at: "2026-10-15T10:00:00Z",
  my_progress: "watching",
  sort_key: "show",
}

/** Minimal stand-in for the Supabase client: records calls, answers with a fixed reply. */
function stub(reply: { data: unknown; error: unknown }) {
  const calls: unknown[][] = []
  const chain: Record<string, unknown> = {}
  for (const name of ["from", "select", "insert", "update", "delete", "eq", "order", "limit"])
    chain[name] = (...args: unknown[]) => (calls.push([name, ...args]), chain)
  chain.then = (resolve: (v: unknown) => void) => resolve(reply)
  const db = {
    ...chain,
    rpc: async (...args: unknown[]) => (calls.push(["rpc", ...args]), reply),
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
  }
  return { db: db as unknown as Db, calls }
}

describe("SupabaseWatchGateway", () => {
  it("lists through the RPC and builds the keyset cursor from sort_key", async () => {
    const { db, calls } = stub({ data: [row], error: null })
    const filters = { ...DEFAULT_FILTERS, sort: "title" as const, search: "sh" }
    const page = await new SupabaseWatchGateway(db).list({
      spaceId: "s1",
      filters,
      cursor: null,
      size: 1,
    })
    expect(calls[0]).toEqual([
      "rpc",
      "list_watch_items",
      expect.objectContaining({ target_space: "s1", sort_by: "title", search: "sh", page_size: 1 }),
    ])
    expect(page).toMatchObject({
      ok: true,
      value: {
        items: [{ id: "i1", catalog: { type: "tv", id: 9 }, myStatus: "watching" }],
        next: { key: "show", id: "i1" },
      },
    })
  })

  it("reads a delete that RLS filtered out as not allowed", async () => {
    const { db } = stub({ data: [], error: null })
    const removed = await new SupabaseWatchGateway(db).remove("i1")
    expect(removed).toMatchObject({ ok: false, error: { kind: "denied" } })
  })

  it("maps both duplicate signals to one friendly conflict", () => {
    expect(toWatchError({ code: "23505", message: "dup key" })).toEqual({
      kind: "conflict",
      message: "Already on your list",
    })
    expect(toWatchError({ code: "P0001", message: "Already on your list" }).kind).toBe("conflict")
    expect(toWatchError({ code: "42501" }).kind).toBe("denied")
  })
})
