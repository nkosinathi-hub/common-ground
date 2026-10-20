import { describe, expect, it } from "vitest"
import { NOW, connected, setup } from "./service-fixture.ts"

const linked = (cursor: string | null) => {
  const context = setup()
  context.store.rows.set("u1", connected(3 * 86_400_000, cursor))
  return context
}

const SHOWS = {
  shows: [
    {
      show: { ids: { tmdb: 1 } },
      last_watched_at: "2026-01-05T00:00:00Z",
      seasons: [{ number: 1, episodes: [{ number: 2 }] }],
    },
  ],
}
const MOVIES = {
  movies: [
    { status: "completed", last_watched_at: "2026-01-06T00:00:00Z", movie: { ids: { tmdb: 2 } } },
  ],
}

describe("simkl sync", () => {
  it("refuses a user who has not connected, or is still pending", async () => {
    const { service, store } = setup()
    expect(await service.sync("u1")).toMatchObject({ ok: false, kind: "not_found" })
    store.rows.set("u1", { ...connected(), accessToken: null, connected: false })
    expect(await service.sync("u1")).toMatchObject({ ok: false, kind: "not_found" })
  })

  it("imports shows and movies since the cursor and advances it", async () => {
    const { service, store, stub } = linked("2026-01-01T00:00:00+00:00")
    stub.reply("GET /sync/all-items/shows", { status: 200, body: SHOWS })
    stub.reply("GET /sync/all-items/movies", { status: 200, body: MOVIES })
    expect(await service.sync("u1")).toEqual({
      ok: true,
      body: { added: 2, lastSyncedAt: NOW.toISOString() },
    })
    const shows = stub.sent("GET /sync/all-items/shows")[0]
    expect(shows?.query.get("date_from")).toBe("2026-01-01T00:00:00Z")
    expect(shows?.headers.get("authorization")).toBe("Bearer simkl_at_old")
    expect(store.rows.get("u1")?.cursor).toBe("2026-02-01T00:00:00Z")
    expect(store.rows.get("u1")?.watches).toHaveLength(2)
  })

  it("fetches nothing when no activity moved past the cursor", async () => {
    const { service, stub } = linked("2026-02-01T00:00:00.000Z")
    expect(await service.sync("u1")).toMatchObject({ ok: true, body: { added: 0 } })
    expect(stub.requests.map((r) => r.route)).toEqual(["GET /sync/activities"])
  })

  it("fetches only the kinds whose activity moved", async () => {
    const { service, stub } = linked("2026-01-01T00:00:00Z")
    const body = {
      all: "2026-02-01T00:00:00Z",
      tv_shows: { all: "2026-02-01T00:00:00Z" },
      movies: { all: "2025-01-01T00:00:00Z" },
    }
    stub.reply("GET /sync/activities", { status: 200, body })
    await service.sync("u1")
    expect(stub.sent("GET /sync/all-items/shows")).toHaveLength(1)
    expect(stub.sent("GET /sync/all-items/movies")).toHaveLength(0)
  })

  it("keeps the cursor when a fetch fails", async () => {
    const { service, store, stub } = linked(null)
    stub.reply("GET /sync/all-items/shows", { status: 500, body: {} })
    expect(await service.sync("u1")).toMatchObject({ ok: false, kind: "unavailable" })
    expect(store.rows.get("u1")?.cursor).toBeNull()
  })
})
