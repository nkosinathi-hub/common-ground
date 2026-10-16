import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { DEFAULT_FILTERS } from "../domain/filters"
import { WATCH_ROW } from "../testing/watch-row"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseWatchGateway } from "./supabase-watch-gateway"

const row = WATCH_ROW

const gatewayFor = (replies: Reply[], userId?: string | null) => {
  const { client: db, calls } = recordingClient(replies, userId)
  return { gateway: new SupabaseWatchGateway(db as Db), calls }
}

describe("SupabaseWatchGateway", () => {
  it("lists through the RPC and builds the keyset cursor from sort_key", async () => {
    const extra = { ...row, id: "i2", sort_key: "show 2" }
    const { gateway, calls } = gatewayFor([{ data: [row, extra], error: null }])
    const filters = { ...DEFAULT_FILTERS, sort: "title" as const, search: "sh" }
    const page = await gateway.list({ spaceId: "s1", filters, cursor: null, size: 1 })
    expect(calls[0]).toEqual([
      "rpc",
      "list_watch_items",
      expect.objectContaining({ target_space: "s1", sort_by: "title", search: "sh", page_size: 2 }),
    ])
    expect(page).toMatchObject({
      ok: true,
      value: {
        items: [{ id: "i1", catalog: { type: "tv", id: 9 }, myStatus: "watching" }],
        next: { key: "show", id: "i1" },
      },
    })
  })

  it("never queries with an empty user id when signed out", async () => {
    const { gateway, calls } = gatewayFor([], null)
    expect(await gateway.get("s1", "i1")).toMatchObject({ error: { kind: "unauthenticated" } })
    expect(await gateway.progress("i1")).toMatchObject({ error: { kind: "unauthenticated" } })
    expect(calls).toEqual([])
  })

  it("reads a delete that RLS filtered out as not allowed", async () => {
    const { gateway } = gatewayFor([{ data: [], error: null }])
    expect(await gateway.remove("i1")).toMatchObject({ ok: false, error: { kind: "denied" } })
  })

  it("reads an update that touched no row as gone", async () => {
    const { gateway } = gatewayFor([{ data: [], error: null }])
    expect(await gateway.setIntent("i1", "archived")).toMatchObject({
      error: { kind: "not_found" },
    })
  })

  it("passes null for a catalog pick without a year or poster", async () => {
    const { gateway, calls } = gatewayFor([{ data: "new-id", error: null }])
    const pick = {
      catalog: { type: "movie" as const, id: 1 },
      title: "Dune",
      mediaType: "movie" as const,
      releaseYear: null,
      synopsis: "",
      posterPath: null,
    }
    expect(await gateway.addCatalog("s1", pick, "want_to_watch")).toEqual({
      ok: true,
      value: "new-id",
    })
    expect(calls[0]?.[2]).toMatchObject({ release_year: null, poster_path: null })
  })
})
