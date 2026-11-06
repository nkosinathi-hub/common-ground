import { describe, expect, it, vi } from "vitest"
import { introSegments } from "./introdb"
const ref = { kind: "episode", tmdbId: 1396, season: 1, episode: 1 } as const
it("converts verified timings and ignores invalid or unknown intro boundaries", async () => {
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(
        JSON.stringify({
          intro: [
            { start_ms: 20000, end_ms: 35000 },
            { start_ms: 40000, end_ms: null },
          ],
          credits: [{ start_ms: 50000, end_ms: null }],
          recap: [{ start_ms: 3, end_ms: 2 }],
        }),
      ),
  )
  expect(await introSegments(fetcher, ref)).toEqual([
    { kind: "intro", start: 20, end: 35 },
    { kind: "credits", start: 50, end: Infinity },
  ])
})
describe("optional timing metadata", () => {
  it("never fails playback when timing data is unavailable", async () => {
    const down = vi.fn<typeof fetch>(async () => {
      throw new Error("offline")
    })
    expect(await introSegments(down, ref)).toEqual([])
  })
})

it("requests movie timing without episode parameters and tolerates a missing record", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response("", { status: 404 }))
  expect(await introSegments(fetcher, { kind: "movie", tmdbId: 603 })).toEqual([])
  const input = fetcher.mock.calls[0]?.[0]
  if (typeof input !== "string") throw new Error("Expected a timing API URL")
  const url = new URL(input)
  expect(url.searchParams.get("tmdb_id")).toBe("603")
  expect(url.searchParams.has("season")).toBe(false)
})
