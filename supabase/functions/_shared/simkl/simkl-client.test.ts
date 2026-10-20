import { describe, expect, it, vi } from "vitest"
import { DEFAULT_SIMKL_BASE_URL, createSimklClient } from "./simkl-client.ts"

const respond = (status: number, body: unknown = {}) =>
  vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))

const client = (fetch: ReturnType<typeof respond>) =>
  createSimklClient({ clientId: "cid", baseUrl: "http://simkl.test/", fetch })

const sent = (fetch: ReturnType<typeof respond>) => {
  const [url = "", init = {}] = fetch.mock.calls[0] ?? []
  return { url: new URL(url), headers: new Headers(init.headers), init }
}

describe("createSimklClient", () => {
  it("starts a PIN with the client id and the app's name", async () => {
    const fetch = respond(200, { result: "OK", user_code: "ABCDE" })
    expect(await client(fetch).startPin()).toEqual({
      ok: true,
      body: { result: "OK", user_code: "ABCDE" },
    })
    const { url, headers, init } = sent(fetch)
    expect(url.origin + url.pathname).toBe("http://simkl.test/oauth/pin")
    expect(url.searchParams.get("client_id")).toBe("cid")
    expect(url.searchParams.get("app-name")).toBe("common-ground")
    expect(headers.get("simkl-api-key")).toBe("cid")
    expect(headers.get("authorization")).toBeNull()
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it("polls the PIN by its user code, escaped", async () => {
    const fetch = respond(200, { result: "KO" })
    await client(fetch).pollPin("AB/CD")
    expect(sent(fetch).url.pathname).toBe("/oauth/pin/AB%2FCD")
  })

  it("reads activities and items with the user's token", async () => {
    const fetch = respond(200, { all: "2026-01-01T00:00:00Z" })
    await client(fetch).activities("tok")
    expect(sent(fetch).url.pathname).toBe("/sync/activities")
    expect(sent(fetch).headers.get("authorization")).toBe("Bearer tok")
  })

  it("asks for every item since the cursor with episode watch dates", async () => {
    const fetch = respond(200, { shows: [] })
    await client(fetch).allItems("tok", "shows", "2026-01-01T00:00:00Z")
    const { url } = sent(fetch)
    expect(url.pathname).toBe("/sync/all-items/shows")
    expect(url.searchParams.get("date_from")).toBe("2026-01-01T00:00:00Z")
    expect(url.searchParams.get("extended")).toBe("full")
    expect(url.searchParams.get("episode_watched_at")).toBe("yes")
    const first = respond(200, null)
    await client(first).allItems("tok", "movies", null)
    expect(sent(first).url.searchParams.has("date_from")).toBe(false)
  })

  it("defaults to the public Simkl API", async () => {
    const fetch = respond(200)
    await createSimklClient({ clientId: "c", fetch }).startPin()
    expect(sent(fetch).url.origin).toBe(DEFAULT_SIMKL_BASE_URL)
  })

  it.each([
    [401, "unauthorized"],
    [403, "unauthorized"],
    [429, "rate_limited"],
    [500, "unavailable"],
    [400, "unavailable"],
  ])("maps HTTP %i to %s", async (status, failure) => {
    expect(await client(respond(status)).activities("t")).toEqual({ ok: false, failure })
  })

  it("treats network errors and unreadable replies as unavailable", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("network")
    })
    const junk = vi.fn(async () => new Response("<html>", { status: 200 }))
    const make = (fetch: typeof down | typeof junk) => createSimklClient({ clientId: "c", fetch })
    expect(await make(down).startPin()).toEqual({ ok: false, failure: "unavailable" })
    expect(await make(junk).startPin()).toEqual({ ok: false, failure: "unavailable" })
  })
})
