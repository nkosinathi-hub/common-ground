// @vitest-environment node
// Against a real Jellyfin 12 server, skipped unless JELLYFIN_LIVE_URL is set (docs/runbooks/jellyfin.md):
// JELLYFIN_LIVE_URL, JELLYFIN_LIVE_USER, JELLYFIN_LIVE_PASSWORD_FILE and JELLYFIN_LIVE_TMDB (a film
// in the library, by TMDB id). The password is read from the file and never logged.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { fakeDeps, MemoryCredentials, RecordingLog } from "../../testing/fake-plugin"
import { JellyfinAccount } from "./account"
import { jellyfinPlugin } from "./plugin"

const env = process.env
const live = env.JELLYFIN_LIVE_URL ?? ""
const signal = () => AbortSignal.timeout(15_000)

describe.skipIf(!live)("jellyfin against a real server", () => {
  const credentials = new MemoryCredentials()
  const deps = { ...fakeDeps(), credentials, log: new RecordingLog(), id: "jf" }
  const account = new JellyfinAccount({ origin: live, fetch, credentials, providerId: "jf" })
  const password = () => readFileSync(env.JELLYFIN_LIVE_PASSWORD_FILE ?? "", "utf8").trim()
  const film = { kind: "movie" as const, tmdbId: Number(env.JELLYFIN_LIVE_TMDB) }

  it("signs in, resolves the film by TMDB id, streams it only with the token, and records progress", async () => {
    const wrong = await account.signIn(env.JELLYFIN_LIVE_USER ?? "", "not the password", "cg-live")
    expect(wrong.ok).toBe(false)
    expect((await account.signIn(env.JELLYFIN_LIVE_USER ?? "", password(), "cg-live")).ok).toBe(
      true,
    )

    const plugin = jellyfinPlugin(live, () => true)
    const options = plugin.validateOptions({ serverUrl: live })
    if (!options.ok) throw new Error(options.error.message)
    const jellyfin = plugin.create(options.value, deps)
    const resolved = await jellyfin.resolve(film, signal())
    if (!resolved.ok) throw new Error(resolved.error.message)
    const [source] = resolved.value
    expect(source?.url.startsWith(live)).toBe(true)
    expect(source?.url).not.toMatch(/api_?key|token/i)

    // Jellyfin 12.2 serves /Videos/{id}/stream without a token (found by this test); only the
    // API that lists item ids needs one. So the server stays on the tailnet (docs/runbooks/jellyfin.md).
    const range = { Range: "bytes=0-1023" }
    const listing = await fetch(`${live}/Items?recursive=true`, { signal: signal() })
    expect(listing.status).toBe(401)
    const authorised = await fetch(source!.url, {
      headers: { ...range, ...source!.requestHeaders },
      signal: signal(),
    })
    expect([200, 206]).toContain(authorised.status)
    expect((await authorised.arrayBuffer()).byteLength).toBeGreaterThan(0)

    const event = { source: source!, positionSeconds: 95, paused: true, keepalive: false }
    await jellyfin.report?.({ ...event, kind: "start", positionSeconds: 0 })
    await jellyfin.report?.({ ...event, kind: "progress" })
    await jellyfin.report?.({ ...event, kind: "stop" })
    const again = await jellyfin.resolve(film, signal())
    expect(again.ok && again.value[0]?.resumeSeconds).toBeCloseTo(95, 0)

    await account.signOut()
    expect(await account.signedIn()).toBe(false)
    const revoked = await fetch(`${live}/Users/Me`, { headers: source!.requestHeaders })
    expect(revoked.status).toBe(401)
  }, 60_000)
})
