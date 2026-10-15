import { describe, expect, it, vi } from "vitest"
import { failureWith, success } from "./outcome.ts"
import { jsonResponse, serveJson } from "./serve.ts"

const ORIGIN = "http://127.0.0.1:5173"
const failure = failureWith({
  validation: "Invalid",
  unauthenticated: "Sign in",
  denied: "Denied",
  not_found: "Gone",
  rate_limited: "Slow",
  unavailable: "Down",
})

function setup(withoutOrigin?: (body: unknown) => boolean) {
  const handle = vi.fn(async (body: unknown) => success({ echoed: body }))
  const serve = serveJson({ allowedOrigins: [ORIGIN], failure, withoutOrigin, handle })
  const call = (method: string, origin: string | null, body?: unknown) =>
    serve(
      new Request("http://fn.test", {
        method,
        headers: origin ? { origin } : {},
        body: body === undefined ? null : JSON.stringify(body),
      }),
    )
  return { call, handle }
}

describe("serveJson", () => {
  it("passes an allowed browser POST to the handler with CORS", async () => {
    const response = await setup().call("POST", ORIGIN, { a: 1 })
    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN)
    expect(await response.json()).toEqual({ echoed: { a: 1 } })
  })

  it("answers preflight only for an allowed origin", async () => {
    const { call } = setup()
    expect((await call("OPTIONS", ORIGIN)).status).toBe(204)
    expect((await call("OPTIONS", null)).status).toBe(403)
  })

  it("refuses other origins and methods before the handler runs", async () => {
    const { call, handle } = setup()
    expect((await call("POST", "https://evil.example", {})).status).toBe(403)
    expect((await call("GET", ORIGIN)).status).toBe(400)
    expect(handle).not.toHaveBeenCalled()
  })

  it("refuses a request without an Origin unless the body is exempt", async () => {
    const { call, handle } = setup((body) => (body as { action?: string }).action === "cleanup")
    expect((await call("POST", null, { action: "start" })).status).toBe(403)
    expect(handle).not.toHaveBeenCalled()
    expect((await call("POST", null, { action: "cleanup" })).status).toBe(200)
    expect((await setup().call("POST", null, { action: "cleanup" })).status).toBe(403)
  })

  it("hides a thrown error behind the function's 503 copy", async () => {
    const { call, handle } = setup()
    handle.mockRejectedValueOnce(new Error("connection refused at db:5432"))
    const response = await call("POST", ORIGIN, {})
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { kind: "unavailable", message: "Down" } })
  })
})

describe("jsonResponse", () => {
  it("returns private, uncached JSON", async () => {
    const body = { error: { kind: "rate_limited", message: "x" } }
    const response = jsonResponse(429, body, { Vary: "Origin" })
    expect(response.status).toBe(429)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("content-type")).toBe("application/json")
    expect(response.headers.get("vary")).toBe("Origin")
    expect(await response.json()).toEqual(body)
  })
})
