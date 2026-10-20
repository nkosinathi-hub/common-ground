import { describe, expect, it, vi } from "vitest"
import { invokeFunction, toFunctionError, type FunctionCopy } from "./functions"

const COPY: FunctionCopy = {
  outage: "Down. Try again",
  copy: { denied: "No access", rate_limited: "Busy" },
  ownCopy: ["validation"],
}
const httpError = (status: number, body: unknown) => ({
  name: "FunctionsHttpError",
  context: new Response(JSON.stringify(body), { status }),
})
const failing = (kind: string, message = "internal") => httpError(400, { error: { kind, message } })

describe("toFunctionError", () => {
  it("passes the function's own copy through only for the kinds that carry it", async () => {
    expect(await toFunctionError(failing("validation", "Too short"), COPY)).toEqual({
      kind: "validation",
      message: "Too short",
    })
    expect(await toFunctionError(failing("denied"), COPY)).toEqual({
      kind: "denied",
      message: "No access",
    })
    expect(await toFunctionError(failing("rate_limited"), COPY)).toEqual({
      kind: "rate_limited",
      message: "Busy",
    })
  })

  it("tells an origin refusal apart from a missing membership", async () => {
    const origin = await toFunctionError(failing("denied", "Origin not allowed"), COPY)
    expect(origin.kind).toBe("denied")
    expect(origin.message).toMatch(/address is not allowed/)
    expect((await toFunctionError(failing("denied", "Not a member"), COPY)).message).toBe(
      "No access",
    )
  })

  it("reads unavailable and transport failures as the outage", async () => {
    const outage = { kind: "network", message: "Down. Try again" }
    expect(await toFunctionError(failing("unavailable"), COPY)).toEqual(outage)
    expect(await toFunctionError({ name: "FunctionsFetchError", context: {} }, COPY)).toEqual(
      outage,
    )
    expect(await toFunctionError(null, COPY)).toEqual(outage)
    expect(await toFunctionError(httpError(500, "not json"), COPY)).toEqual(outage)
    const broken = {
      name: "FunctionsHttpError",
      context: { json: () => Promise.reject(new SyntaxError("not json")) },
    }
    expect(await toFunctionError(broken, COPY)).toEqual(outage)
  })

  it("hides kinds it does not know and kinds without copy", async () => {
    const unknown = { kind: "unknown", message: "Something went wrong. Try again" }
    expect(await toFunctionError(failing("weird"), COPY)).toEqual(unknown)
    expect((await toFunctionError(failing("not_found"), COPY)).message).toBe(unknown.message)
  })
})

describe("invokeFunction", () => {
  it("invokes the named function with the body and signal", async () => {
    const invoke = vi.fn(async () => ({ data: { url: "u" }, error: null }))
    const signal = new AbortController().signal
    const reply = await invokeFunction(
      { functions: { invoke } } as never,
      "f",
      { a: 1 },
      COPY,
      signal,
    )
    expect(reply).toEqual({ ok: true, value: { url: "u" } })
    expect(invoke).toHaveBeenCalledWith("f", { body: { a: 1 }, signal })
  })

  it("maps errors, and a thrown transport error to the outage", async () => {
    const error = failing("denied")
    const refused = vi.fn(async () => ({ data: null, error }))
    expect(
      await invokeFunction({ functions: { invoke: refused } } as never, "f", {}, COPY),
    ).toEqual({ ok: false, error: { kind: "denied", message: "No access" } })
    const thrown = vi.fn(async () => Promise.reject(new TypeError("fetch failed")))
    expect(await invokeFunction({ functions: { invoke: thrown } } as never, "f", {}, COPY)).toEqual(
      { ok: false, error: { kind: "network", message: "Down. Try again" } },
    )
  })
})
