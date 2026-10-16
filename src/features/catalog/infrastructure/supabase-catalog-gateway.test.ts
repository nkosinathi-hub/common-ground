import { describe, expect, it, vi } from "vitest"
import { toFunctionError } from "@/shared/infrastructure/functions"
import { CATALOG_COPY, OUTAGE_MESSAGE } from "./catalog-errors"
import { SupabaseCatalogGateway } from "./supabase-catalog-gateway"

const httpError = (status: number, body: unknown) => ({
  name: "FunctionsHttpError",
  context: new Response(JSON.stringify(body), { status }),
})

const gatewayReturning = (reply: unknown) => {
  const invoke = vi.fn(async () => reply)
  const db = { functions: { invoke } } as unknown as ConstructorParameters<
    typeof SupabaseCatalogGateway
  >[0]
  return { invoke, gateway: new SupabaseCatalogGateway(db) }
}

describe("SupabaseCatalogGateway", () => {
  it("invokes the catalog function with the action, space and signal", async () => {
    const { invoke, gateway } = gatewayReturning({ data: { results: [] }, error: null })
    const signal = new AbortController().signal
    expect(await gateway.search({ spaceId: "s", query: "dune", page: 2 }, signal)).toEqual({
      ok: true,
      value: { results: [] },
    })
    expect(invoke).toHaveBeenCalledWith("catalog", {
      body: { action: "search", spaceId: "s", q: "dune", page: 2 },
      signal,
    })
    await gateway.refresh({ spaceId: "s", type: "tv", id: 9 })
    expect(invoke).toHaveBeenLastCalledWith("catalog", {
      body: { action: "refresh", spaceId: "s", type: "tv", id: 9 },
      signal: undefined,
    })
  })

  it("maps function errors by kind", async () => {
    const { gateway } = gatewayReturning({
      data: null,
      error: httpError(429, { error: { kind: "rate_limited", message: "busy" } }),
    })
    const result = await gateway.details({ spaceId: "s", type: "movie", id: 1 })
    expect(!result.ok && result.error.kind).toBe("rate_limited")
  })

  it("treats a thrown transport error as an outage", async () => {
    const invoke = vi.fn(async () => Promise.reject(new TypeError("fetch failed")))
    const gateway = new SupabaseCatalogGateway({ functions: { invoke } } as never)
    const result = await gateway.search({ spaceId: "s", query: "dune", page: 1 })
    expect(result).toEqual({ ok: false, error: { kind: "network", message: OUTAGE_MESSAGE } })
  })
})

const toCatalogError = (error: unknown) => toFunctionError(error, CATALOG_COPY)

describe("catalog copy", () => {
  it("maps an unavailable catalog to a network outage that keeps the query", async () => {
    const error = await toCatalogError(
      httpError(503, { error: { kind: "unavailable", message: "x" } }),
    )
    expect(error).toEqual({ kind: "network", message: OUTAGE_MESSAGE })
  })

  it("passes validation messages through and hides others", async () => {
    expect(
      await toCatalogError(httpError(400, { error: { kind: "validation", message: "Too short" } })),
    ).toEqual({
      kind: "validation",
      message: "Too short",
    })
    const denied = await toCatalogError(
      httpError(403, { error: { kind: "denied", message: "internal" } }),
    )
    expect(denied).toEqual({ kind: "denied", message: "You do not have access to this space" })
  })

  it("treats relay and fetch errors or junk bodies as network failures", async () => {
    expect((await toCatalogError({ name: "FunctionsFetchError", context: {} })).kind).toBe(
      "network",
    )
    expect((await toCatalogError(httpError(500, "not json"))).kind).toBe("network")
    expect((await toCatalogError(httpError(500, { error: { kind: "weird" } }))).kind).toBe(
      "unknown",
    )
  })
})
