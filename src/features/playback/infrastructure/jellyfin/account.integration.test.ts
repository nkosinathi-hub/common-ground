// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fakeSource, MemoryCredentials } from "../../testing/fake-plugin"
import { startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { jellyfinRoutes, TOKEN } from "../../testing/jellyfin-routes"
import { JellyfinAccount } from "./account"
import { jellyfinPlugin } from "./plugin"
import { fakeDeps } from "../../testing/fake-plugin"

let server: FixtureServer
beforeAll(async () => (server = await startFixtureServer(jellyfinRoutes)))
afterAll(() => server.close())

const signedIn = async () => {
  const credentials = new MemoryCredentials()
  await credentials.set("jf", { token: TOKEN, userId: "u1", deviceId: "d1" })
  return credentials
}
const account = (credentials: MemoryCredentials) =>
  new JellyfinAccount({ origin: server.origin, fetch, credentials, providerId: "jf" })

describe("JellyfinAccount", () => {
  it("signs in by name and keeps the token on the device only", async () => {
    const credentials = new MemoryCredentials()
    const jf = account(credentials)
    expect((await jf.signIn("nkosi", "wrong", "d1")).ok).toBe(false)
    expect(await jf.signIn("nkosi", "right", "d1")).toEqual({ ok: true, value: undefined })
    expect(credentials.saved.get("jf")).toEqual({ token: TOKEN, userId: "u1", deviceId: "d1" })
    expect(await jf.signedIn()).toBe(true)
  })

  it("revokes the session on the server, then forgets the token", async () => {
    const credentials = await signedIn()
    await account(credentials).signOut()
    expect(server.hits.some((h) => h.method === "POST" && h.path === "/Sessions/Logout")).toBe(true)
    expect(credentials.saved.size).toBe(0)
    await expect(account(credentials).signOut()).resolves.toBeUndefined()
  })

  it("reads the next episode from NextUp", async () => {
    const jf = account(await signedIn())
    expect(await jf.nextUp(1399)).toEqual({
      ok: true,
      value: { season: 1, episode: 2, title: "Two" },
    })
    expect(await jf.nextUp(42)).toMatchObject({ ok: false, error: { kind: "not_found" } })
    expect((await account(new MemoryCredentials()).nextUp(1399)).ok).toBe(false)
  })
})

describe("jellyfin progress reports", () => {
  it("sends start, progress and stop with ticks, the session ids and keepalive", async () => {
    const credentials = await signedIn()
    const plugin = jellyfinPlugin(server.origin, () => true)
    const provider = plugin.create(
      { serverUrl: server.origin },
      { ...fakeDeps(), credentials, id: "jf" },
    )
    const source = {
      ...fakeSource("jf", "jf"),
      providerData: { itemId: "m1", mediaSourceId: "ms-m1", playSessionId: "ps1" },
    }
    for (const kind of ["start", "progress", "stop"] as const)
      await provider.report?.({
        kind,
        source,
        positionSeconds: 12.5,
        paused: false,
        keepalive: kind === "stop",
      })
    await provider.report?.({
      kind: "stop",
      source: fakeSource("jf", "jf"),
      positionSeconds: 1,
      paused: true,
      keepalive: true,
    })
    const reports = server.hits.filter((h) => h.path.startsWith("/Sessions/Playing"))
    expect(reports.map((h) => h.path)).toEqual([
      "/Sessions/Playing",
      "/Sessions/Playing/Progress",
      "/Sessions/Playing/Stopped",
    ])
    expect(JSON.parse(reports[0]?.body ?? "{}")).toMatchObject({
      ItemId: "m1",
      PlaySessionId: "ps1",
      PositionTicks: 125_000_000,
    })
    expect(reports.every((h) => String(h.headers.authorization).includes(TOKEN))).toBe(true)
  })
})
