import { describe, expect, it, vi } from "vitest"
import pkg from "../../../../package.json"
import { APP, DEFAULT_SIMKL_BASE_URL, createSimklClient } from "./simkl-client.ts"
import { STUB_BASE_URL, StubSimkl } from "./stub-simkl.ts"

function setup() {
  const stub = new StubSimkl()
  const client = createSimklClient({ clientId: "cid", baseUrl: STUB_BASE_URL, fetch: stub.fetch })
  return { stub, client }
}

describe("createSimklClient", () => {
  it("names the app on every request, as Simkl requires", async () => {
    const { stub, client } = setup()
    await client.startDevice()
    await client.activities("at")
    for (const request of stub.requests) {
      expect(request.query.get("client_id")).toBe("cid")
      expect(request.query.get("app-name")).toBe("common-ground")
      expect(request.query.get("app-version")).toBe(pkg.version)
      expect(request.headers.get("user-agent")).toBe(`common-ground/${pkg.version}`)
    }
    expect(APP.version).toBe(pkg.version)
  })

  it("starts the device flow with a form body asking for read access only", async () => {
    const { stub, client } = setup()
    expect(await client.startDevice()).toMatchObject({ ok: true })
    const [request] = stub.sent("POST /oauth2/device")
    expect(request?.headers.get("content-type")).toBe("application/x-www-form-urlencoded")
    expect(Object.fromEntries(request?.form ?? [])).toEqual({
      client_id: "cid",
      scope: "media:read",
    })
    expect(request?.headers.get("authorization")).toBeNull()
  })

  it("posts token grants and revocations as forms with the client id", async () => {
    const { stub, client } = setup()
    await client.token({ grant_type: "refresh_token", refresh_token: "rt" })
    await client.revoke("rt")
    expect(Object.fromEntries(stub.sent("POST /oauth2/token")[0]?.form ?? [])).toEqual({
      client_id: "cid",
      grant_type: "refresh_token",
      refresh_token: "rt",
    })
    expect(Object.fromEntries(stub.sent("POST /oauth2/revoke")[0]?.form ?? [])).toEqual({
      client_id: "cid",
      token: "rt",
    })
  })

  it("reads OAuth errors by their error field", async () => {
    const { stub, client } = setup()
    stub.reply("POST /oauth2/token", { status: 400, body: { error: "slow_down" } })
    expect(await client.token({})).toEqual({ ok: false, failure: "rejected", error: "slow_down" })
    stub.reply("POST /oauth2/token", { status: 401, body: { error: "invalid_client" } })
    expect(await client.token({})).toEqual({
      ok: false,
      failure: "unauthorized",
      error: "invalid_client",
    })
  })

  it("reads activities and items with the bearer token and the cursor", async () => {
    const { stub, client } = setup()
    await client.allItems("at", "shows", "2026-01-01T00:00:00Z")
    const [request] = stub.sent("GET /sync/all-items/shows")
    expect(request?.headers.get("authorization")).toBe("Bearer at")
    expect(request?.query.get("date_from")).toBe("2026-01-01T00:00:00Z")
    expect(request?.query.get("extended")).toBe("full")
    expect(request?.query.get("episode_watched_at")).toBe("yes")
    await client.allItems("at", "movies", null)
    expect(stub.sent("GET /sync/all-items/movies")[0]?.query.has("date_from")).toBe(false)
  })

  it.each([
    [401, "unauthorized"],
    [403, "unauthorized"],
    [429, "rate_limited"],
    [400, "rejected"],
    [500, "unavailable"],
  ])("maps HTTP %i to %s", async (status, failure) => {
    const { stub, client } = setup()
    stub.reply("GET /sync/activities", { status, body: "<html>" })
    expect(await client.activities("t")).toEqual({ ok: false, failure, error: null })
  })

  it("treats network errors and unreadable replies as unavailable", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("network")
    })
    const junk = vi.fn(async () => new Response("<html>", { status: 200 }))
    const make = (fetch: typeof down | typeof junk) => createSimklClient({ clientId: "c", fetch })
    expect(await make(down).startDevice()).toMatchObject({ ok: false, failure: "unavailable" })
    expect(await make(junk).activities("t")).toMatchObject({ ok: false, failure: "unavailable" })
    expect(DEFAULT_SIMKL_BASE_URL).toBe("https://api.simkl.com")
  })
})
