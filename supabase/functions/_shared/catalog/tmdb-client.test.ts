import { describe, expect, it, vi } from "vitest"
import { DEFAULT_TMDB_BASE_URL, createTmdbClient } from "./tmdb-client.ts"

const respond = (status: number, body: unknown = {}) =>
  vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))

describe("createTmdbClient", () => {
  it("sends the bearer token to the configured base url", async () => {
    const fetch = respond(200, { ok: 1 })
    const client = createTmdbClient({ baseUrl: "http://fixture.test/3/", token: "t0k", fetch })
    expect(await client.get("movie/1")).toEqual({ ok: true, body: { ok: 1 } })
    const [url, init = {}] = fetch.mock.calls[0] ?? []
    expect(url).toBe("http://fixture.test/3/movie/1")
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer t0k")
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it("defaults to the public TMDB API", async () => {
    const fetch = respond(200)
    await createTmdbClient({ token: "t", fetch }).get("x")
    expect(fetch.mock.calls[0]?.[0]).toBe(`${DEFAULT_TMDB_BASE_URL}/x`)
    expect(DEFAULT_TMDB_BASE_URL).toBe("https://api.themoviedb.org/3")
  })

  it.each([
    [429, "rate_limited"],
    [404, "not_found"],
    [500, "outage"],
    [503, "outage"],
    [401, "unavailable"],
    [400, "unavailable"],
  ])("maps HTTP %i to %s", async (status, failure) => {
    const client = createTmdbClient({ token: "t", fetch: respond(status) })
    expect(await client.get("x")).toEqual({ ok: false, failure })
  })

  it("treats network errors and timeouts as an outage", async () => {
    const fetch = vi.fn(async () => {
      throw new DOMException("timed out", "TimeoutError")
    })
    expect(await createTmdbClient({ token: "t", fetch }).get("x")).toEqual({
      ok: false,
      failure: "outage",
    })
  })

  it("aborts a request that runs past the timeout", async () => {
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)),
        ),
    )
    const result = await createTmdbClient({ token: "t", fetch, timeoutMs: 5 }).get("x")
    expect(result).toEqual({ ok: false, failure: "outage" })
  })

  it("refuses to call TMDB without a token", async () => {
    const fetch = respond(200)
    expect(await createTmdbClient({ token: "", fetch }).get("x")).toEqual({
      ok: false,
      failure: "unavailable",
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("treats an unreadable body as an outage", async () => {
    const fetch = vi.fn(async () => new Response("<html>", { status: 200 }))
    expect(await createTmdbClient({ token: "t", fetch }).get("x")).toEqual({
      ok: false,
      failure: "outage",
    })
  })
})
