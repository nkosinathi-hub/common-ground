import { test } from "node:test"
import assert from "node:assert/strict"
import { collect } from "./collect.mjs"
import { install } from "./install.mjs"

const result = (language) => [
  { sources: [{ audioTracks: [{ language }] }], subtitles: [], diagnostics: [] },
]

test("validated English arrives without waiting for a hanging provider, and aborts its work", async () => {
  let pending
  const found = await collect(
    [
      async () => result("spa"),
      async () => result("eng"),
      (signal) => {
        pending = signal
        return new Promise(() => {})
      },
    ],
    { timeoutMs: 200, settleMs: 5 },
  )
  assert.equal(found.length, 2)
  assert.equal(pending.aborted, true)
})

test("deadline still returns unknown-language fallbacks; errors and empty registries settle", async () => {
  assert.equal(
    (
      await collect([async () => result("Original"), () => new Promise(() => {})], {
        timeoutMs: 10,
      })
    ).length,
    1,
  )
  assert.deepEqual(await collect([]), [])
  assert.deepEqual(
    await collect([
      async () => {
        throw Error("provider")
      },
    ]),
    [],
  )
})

test("installing twice and concurrent repeated lookups never wrap twice or duplicate scrapes", async () => {
  let calls = 0
  class SourceService {
    registry = {
      getProviders: () => [
        { enabled: true, capabilities: { supportedContentTypes: ["movies", "tv"] } },
      ],
    }
    async fetchFromProviders() {
      calls++
      await new Promise((r) => setTimeout(r, 5))
      return result("eng")
    }
    getMovieSources(id) {
      return this.fetchFromProviders("movie", { id })
    }
    getTVSources(id, season, episode) {
      return this.fetchFromProviders("tv", { id, season, episode })
    }
  }
  const fetchTarget = { fetch: async () => new Response("ok") }
  install(SourceService, { fetchTarget })
  const method = SourceService.prototype.getMovieSources
  const fetcher = fetchTarget.fetch
  install(SourceService, { fetchTarget })
  assert.equal(SourceService.prototype.getMovieSources, method)
  assert.equal(fetchTarget.fetch, fetcher)
  const service = new SourceService()
  const [a, b] = await Promise.all([service.getMovieSources(1), service.getMovieSources(1)])
  assert.equal(a, b)
  assert.equal(calls, 1)
  await Promise.all([service.getTVSources(1, 1, 1), service.getTVSources(1, 1, 2)])
  assert.equal(calls, 3)
})
