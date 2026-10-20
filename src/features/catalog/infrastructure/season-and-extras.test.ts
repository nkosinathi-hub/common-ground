import { describe, expect, it, vi } from "vitest"
import { SupabaseCatalogGateway } from "./supabase-catalog-gateway"

const gatewayReturning = (reply: unknown) => {
  const invoke = vi.fn(async () => reply)
  const db = { functions: { invoke } } as unknown as ConstructorParameters<
    typeof SupabaseCatalogGateway
  >[0]
  return { invoke, gateway: new SupabaseCatalogGateway(db) }
}

describe("SupabaseCatalogGateway extras", () => {
  it("asks for one season of a series", async () => {
    const { invoke, gateway } = gatewayReturning({ data: { number: 2, episodes: [] }, error: null })
    expect(await gateway.season({ spaceId: "s", id: 1399, season: 2 })).toMatchObject({
      ok: true,
      value: { number: 2 },
    })
    expect(invoke).toHaveBeenCalledWith("catalog", {
      body: { action: "season", spaceId: "s", type: "tv", id: 1399, season: 2 },
      signal: undefined,
    })
  })

  it("fills the v0.5 fields for details cached before they existed", async () => {
    const cached = { title: { id: 1 }, availability: { regions: [], fallback: true } }
    const { gateway } = gatewayReturning({ data: cached, error: null })
    const result = await gateway.details({ spaceId: "s", type: "tv", id: 1 })
    expect(result).toMatchObject({
      ok: true,
      value: { trailerKey: null, recommendations: [], seasons: [], nextEpisode: null },
    })
  })
})
