// @vitest-environment node
// Against the real Wikidata and Internet Archive, skipped unless ARCHIVE_LIVE=1: proves real films
// match through IMDb -> Wikidata P345 -> P724 and play only with an explicit open licence.
import { describe, expect, it } from "vitest"
import { ok } from "../../../../shared/domain/result"
import { fakeDeps } from "../../testing/fake-plugin"
import { internetArchivePlugin } from "./plugin"

const imdbOf: Record<number, string> = {
  10331: "tt0063350", // Night of the Living Dead (1968), public domain in the US
  3085: "tt0032599", // His Girl Friday (1940), copies marked public domain
  // Big Buck Bunny is CC BY, but the only copy Wikidata links declares no licence: refused.
  10378: "tt1254207",
  603: "tt0133093", // The Matrix (1999), under copyright
}

const AGENT = "CommonGround/0.5 (https://nkosinathi-hub.github.io/common-ground/; tests)"

const provider = () => {
  const tmdb = {
    imdbId: async (ref: { tmdbId: number }) => ok(imdbOf[ref.tmdbId] ?? null),
    videos: async () => ok([]),
  }
  const plugin = internetArchivePlugin()
  const options = plugin.validateOptions(null)
  if (!options.ok) throw new Error(options.error.message)
  // Wikimedia refuses Node's default User-Agent; a browser always sends its own.
  const fetcher: typeof fetch = (input, init) =>
    fetch(input, { ...init, headers: { ...init?.headers, "User-Agent": AGENT } })
  return plugin.create(options.value, { ...fakeDeps(fetcher), tmdb, id: "internet-archive" })
}
const signal = () => AbortSignal.timeout(30_000)

describe.skipIf(!process.env.ARCHIVE_LIVE)("internet archive against the real services", () => {
  for (const tmdbId of [10331, 3085]) {
    it(`finds an openly licensed copy of ${imdbOf[tmdbId]} on archive.org`, async () => {
      const result = await provider().resolve({ kind: "movie", tmdbId }, signal())
      if (!result.ok) throw new Error(result.error.message)
      const file = result.value.find((s) => s.kind === "file")
      expect(new URL(file?.url ?? result.value[0]!.url).hostname).toMatch(/archive\.org$/)
    }, 60_000)
  }

  for (const tmdbId of [603, 10378]) {
    it(`refuses ${imdbOf[tmdbId]}, which has no explicitly licensed copy linked`, async () => {
      const result = await provider().resolve({ kind: "movie", tmdbId }, signal())
      expect(result).toMatchObject({ ok: false, error: { kind: "not_found" } })
    }, 60_000)
  }
})
