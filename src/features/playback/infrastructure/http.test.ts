import { describe, expect, it, vi } from "vitest"
import { requestJson, requestOk, statusError } from "./http"

const reply = (status: number, body: unknown = {}) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe("requestJson", () => {
  it("returns the parsed body and sends method, headers, body and keepalive", async () => {
    const fetcher = reply(200, { a: 1 })
    const signal = new AbortController().signal
    const result = await requestJson(fetcher, {
      url: "https://a.org/x",
      method: "POST",
      headers: { Authorization: "x" },
      body: { b: 2 },
      keepalive: true,
      signal,
    })
    expect(result).toEqual({ ok: true, value: { a: 1 } })
    const init = (fetcher as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls[0]?.[1]
    expect(init).toMatchObject({ method: "POST", keepalive: true, body: '{"b":2}' })
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json", Authorization: "x" })
  })

  it("maps statuses to error kinds", async () => {
    const kinds = await Promise.all(
      [401, 403, 404, 429, 500, 503, 400].map(async (status) => {
        const result = await requestJson(reply(status), { url: "https://a.org" })
        return result.ok ? null : result.error.kind
      }),
    )
    expect(kinds).toEqual([
      "unauthenticated",
      "denied",
      "not_found",
      "rate_limited",
      "network",
      "network",
      "validation",
    ])
  })

  it("answers network for a thrown fetch and unknown for a body that is not JSON", async () => {
    const thrower = vi.fn(async () => {
      throw new TypeError("offline")
    }) as unknown as typeof fetch
    expect(await requestJson(thrower, { url: "https://a.org" })).toMatchObject({
      error: { kind: "network" },
    })
    const junk = vi.fn(
      async () => new Response("<html>", { status: 200 }),
    ) as unknown as typeof fetch
    expect(await requestJson(junk, { url: "https://a.org" })).toMatchObject({
      error: { kind: "unknown" },
    })
  })
})

describe("requestOk", () => {
  it("ignores the body of a success", async () => {
    const empty = vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch
    expect(await requestOk(empty, { url: "https://a.org" })).toEqual({ ok: true, value: undefined })
    expect((await requestOk(reply(500), { url: "https://a.org" })).ok).toBe(false)
  })

  it("names the status in the message", () => {
    expect(statusError(418).message).toContain("418")
  })
})
