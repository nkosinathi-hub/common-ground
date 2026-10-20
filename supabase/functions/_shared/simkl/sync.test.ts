import { describe, expect, it, vi } from "vitest"
import { NOW, ok, setup } from "./service-fixture.ts"
import type { SimklClient } from "./simkl-client.ts"

describe("simkl service: syncing", () => {
  const linked = (cursor: string | null, overrides: Partial<SimklClient> = {}) => {
    const context = setup(overrides)
    context.store.rows.set("u1", { token: "tok", cursor, watches: [] })
    return context
  }

  it("refuses a user who has not connected", async () => {
    expect(await setup().service.sync("u1")).toMatchObject({ ok: false, kind: "not_found" })
  })

  it("imports shows and movies since the cursor and advances it", async () => {
    const show = { show: { ids: { tmdb: 1 } }, seasons: [{ number: 1, episodes: [{ number: 2 }] }] }
    const allItems = vi.fn(async (_t: string, type: string) =>
      type === "shows"
        ? ok({ shows: [{ ...show, last_watched_at: "2026-01-05T00:00:00Z" }] })
        : ok({
            movies: [
              {
                status: "completed",
                last_watched_at: "2026-01-06T00:00:00Z",
                movie: { ids: { tmdb: 2 } },
              },
            ],
          }),
    )
    const { service, store } = linked("2026-01-01T00:00:00+00:00", { allItems })
    const reply = await service.sync("u1")
    expect(reply).toEqual({ ok: true, body: { added: 2, lastSyncedAt: NOW.toISOString() } })
    expect(allItems).toHaveBeenCalledWith("tok", "shows", "2026-01-01T00:00:00Z")
    expect(allItems).toHaveBeenCalledWith("tok", "movies", "2026-01-01T00:00:00Z")
    expect(store.rows.get("u1")?.cursor).toBe("2026-02-01T00:00:00Z")
    expect(store.rows.get("u1")?.watches).toHaveLength(2)
  })

  it("fetches nothing when no activity moved past the cursor", async () => {
    const { service, calls } = linked("2026-02-01T00:00:00.000Z")
    expect(await service.sync("u1")).toMatchObject({ ok: true, body: { added: 0 } })
    expect(calls.allItems).toEqual([])
  })

  it("fetches only the kinds whose activity moved", async () => {
    const activities = async () =>
      ok({
        all: "2026-02-01T00:00:00Z",
        tv_shows: { all: "2026-02-01T00:00:00Z" },
        movies: { all: "2025-01-01T00:00:00Z" },
      })
    const { service, calls } = linked("2026-01-01T00:00:00Z", { activities })
    await service.sync("u1")
    expect(calls.allItems.map((call) => call[1])).toEqual(["shows"])
  })

  it("keeps the cursor when a fetch fails", async () => {
    const allItems = async () => ({ ok: false as const, failure: "unavailable" as const })
    const { service, store } = linked(null, { allItems })
    expect(await service.sync("u1")).toMatchObject({ ok: false, kind: "unavailable" })
    expect(store.rows.get("u1")?.cursor).toBeNull()
  })

  it("forgets a link Simkl no longer accepts", async () => {
    const activities = async () => ({ ok: false as const, failure: "unauthorized" as const })
    const { service, store } = linked(null, { activities })
    expect(await service.sync("u1")).toMatchObject({ ok: false, kind: "denied" })
    expect(store.rows.has("u1")).toBe(false)
  })
})
