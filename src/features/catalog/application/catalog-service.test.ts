import { describe, expect, it } from "vitest"
import { FakeCatalogGateway } from "../testing/fake-catalog-gateway"
import { SPACE_ID, listing, region, title } from "../testing/fixtures"
import { CatalogService } from "./catalog-service"
import { LatestRequest } from "./latest-request"

const setup = () => {
  const gateway = new FakeCatalogGateway()
  gateway.titles = [title(1, "Dune"), title(2, "Dune: Part Two"), title(3, "Arrival")]
  return { gateway, service: new CatalogService(gateway) }
}

describe("CatalogService", () => {
  it("searches with a trimmed query in the given space", async () => {
    const { gateway, service } = setup()
    const result = await service.search({ spaceId: SPACE_ID, query: "  dune ", page: 1 })
    expect(result.ok && result.value.results.map((t) => t.id)).toEqual([1, 2])
    expect(gateway.calls[0]?.request).toEqual({ spaceId: SPACE_ID, query: "dune", page: 1 })
  })

  it("rejects short queries and bad pages without calling the gateway", async () => {
    const { gateway, service } = setup()
    expect((await service.search({ spaceId: SPACE_ID, query: "d" })).ok).toBe(false)
    expect((await service.search({ spaceId: SPACE_ID, query: "dune", page: 21 })).ok).toBe(false)
    expect(gateway.calls).toEqual([])
  })

  it("loads one season of a series", async () => {
    const { gateway, service } = setup()
    gateway.seasons.set("1399:2", { number: 2, episodes: [], checkedAt: "x", stale: false })
    expect((await service.season(SPACE_ID, 1399, 2)).ok).toBe(true)
    expect(gateway.calls.at(-1)).toEqual({
      method: "season",
      request: { spaceId: SPACE_ID, id: 1399, season: 2 },
    })
    expect((await service.season(SPACE_ID, 1399, 9)).ok).toBe(false)
  })

  it("loads and refreshes availability for a title", async () => {
    const { gateway, service } = setup()
    gateway.listings.set("movie:1", listing([region("ZA", "South Africa", "Showmax")], false))
    expect((await service.details(SPACE_ID, { type: "movie", id: 1 })).ok).toBe(true)
    expect((await service.refresh(SPACE_ID, { type: "movie", id: 1 })).ok).toBe(true)
    expect(gateway.calls.map((c) => c.method)).toEqual(["details", "refresh"])
  })
})

describe("LatestRequest", () => {
  it("aborts the previous request and discards its result", async () => {
    const { gateway, service } = setup()
    const latest = new LatestRequest()
    gateway.hold = true
    const first = latest.run((signal) =>
      service.search({ spaceId: SPACE_ID, query: "dun" }, signal),
    )
    const second = latest.run((signal) =>
      service.search({ spaceId: SPACE_ID, query: "dune" }, signal),
    )
    gateway.release()
    expect(await first).toEqual({ current: false })
    expect(await second).toMatchObject({ current: true, value: { ok: true } })
    expect(gateway.aborted.map((c) => (c.request as { query: string }).query)).toEqual(["dun"])
  })

  it("cancel aborts the in-flight request", async () => {
    const { gateway, service } = setup()
    const latest = new LatestRequest()
    gateway.hold = true
    const pending = latest.run((signal) =>
      service.search({ spaceId: SPACE_ID, query: "dune" }, signal),
    )
    latest.cancel()
    gateway.release()
    expect(await pending).toEqual({ current: false })
  })

  it("rethrows failures of the current request only", async () => {
    const latest = new LatestRequest()
    await expect(latest.run(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom")
  })
})
