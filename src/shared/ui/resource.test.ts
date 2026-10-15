import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { Resource } from "./resource.svelte"

describe("Resource", () => {
  it("moves from loading to ready", async () => {
    const r = new Resource(async () => ok(3))
    expect(r.state.status).toBe("loading")
    await r.load()
    expect(r.value).toBe(3)
  })

  it("exposes errors and retries", async () => {
    let fail = true
    const r = new Resource(async () => (fail ? err(appError("network", "down")) : ok("x")))
    await r.load()
    expect(r.state).toMatchObject({ status: "error", error: { kind: "network" } })
    fail = false
    await r.retry()
    expect(r.value).toBe("x")
  })

  it("ignores stale responses", async () => {
    const resolvers: ((v: ReturnType<typeof ok<number>>) => void)[] = []
    const r = new Resource(() => new Promise((resolve) => resolvers.push(resolve)))
    const first = r.load()
    const second = r.load()
    resolvers[1]!(ok(2))
    resolvers[0]!(ok(1))
    await Promise.all([first, second])
    expect(r.value).toBe(2)
  })
})
