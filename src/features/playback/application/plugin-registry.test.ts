import { describe, expect, it } from "vitest"
import { appError, err, ok } from "../../../shared/domain/result"
import { config, fakeDeps, fakePlugin } from "../testing/fake-plugin"
import { PluginRegistry } from "./plugin-registry"

describe("PluginRegistry.register", () => {
  it("accepts a plugin with a valid policy and lists its type", () => {
    const registry = new PluginRegistry()
    expect(registry.register(fakePlugin("alpha"))).toEqual({ ok: true, value: undefined })
    expect(registry.types()).toEqual(["alpha"])
  })

  it("refuses a duplicate type", () => {
    const registry = new PluginRegistry()
    registry.register(fakePlugin("alpha"))
    expect(registry.register(fakePlugin("alpha"))).toMatchObject({
      ok: false,
      error: { kind: "conflict" },
    })
  })

  it.each([["*"], ["http://a.org"], ["javascript:alert(1)"], ["https://*.org"]])(
    "refuses a plugin declaring %s",
    (origin) => {
      const registry = new PluginRegistry()
      const bad = fakePlugin("bad", { security: { media: [origin] } })
      expect(registry.register(bad)).toMatchObject({ ok: false, error: { field: "media" } })
      expect(registry.types()).toEqual([])
    },
  )

  it("refuses a nameless plugin", () => {
    expect(new PluginRegistry().register(fakePlugin("")).ok).toBe(false)
  })
})

describe("PluginRegistry.fromConfig", () => {
  const registry = new PluginRegistry()
  registry.register(fakePlugin("alpha"))
  const strict = fakePlugin("strict")
  registry.register({
    ...strict,
    validateOptions: (raw) =>
      raw === "good" ? ok(null) : err(appError("validation", "options must be good")),
  })

  it("builds enabled providers with their own config id", () => {
    const built = registry.fromConfig(
      [config("alpha", { id: "a1" }), config("alpha", { id: "a2", enabled: false })],
      fakeDeps(),
    )
    expect(built.providers.map((p) => p.provider.id)).toEqual(["a1"])
    expect(built.providers[0]?.policy.media).toEqual(["https://alpha.example.org"])
    expect(built.refused).toEqual([])
  })

  it("refuses unknown types, bad options, duplicate ids and bad numbers, with reasons", () => {
    const built = registry.fromConfig(
      [
        config("ghost"),
        config("strict", { options: "bad" }),
        config("strict", { id: "s", options: "good" }),
        config("alpha", { id: "s" }),
        config("alpha", { id: "t", timeoutMs: 0 }),
        config("alpha", { id: "r", retries: 9 }),
        config("alpha", { id: "p", priority: Number.NaN }),
      ],
      fakeDeps(),
    )
    expect(built.providers.map((p) => p.provider.id)).toEqual(["s"])
    expect(built.refused.map((r) => [r.id, r.reason])).toEqual([
      ["ghost", "no plugin of type ghost"],
      ["strict", "options must be good"],
      ["s", "duplicate provider id"],
      ["t", "timeoutMs must be between 1 and 60000"],
      ["r", "retries must be a whole number from 0 to 5"],
      ["p", "priority must be a number"],
    ])
  })
})
