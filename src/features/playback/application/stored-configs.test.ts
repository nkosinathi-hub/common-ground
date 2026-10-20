import { describe, expect, it } from "vitest"
import { config } from "../testing/fake-plugin"
import { withStoredChoices } from "./stored-configs"

const defaults = [config("a", { priority: 1 }), config("b", { priority: 2 })]

describe("withStoredChoices", () => {
  it("keeps the defaults when nothing is stored or the value is junk", () => {
    expect(withStoredChoices(defaults, null)).toEqual(defaults)
    expect(withStoredChoices(defaults, "{not json")).toEqual(defaults)
    expect(withStoredChoices(defaults, '"text"')).toEqual(defaults)
  })

  it("lets this person turn providers off and reorder them", () => {
    const stored = JSON.stringify([
      { id: "a", enabled: false },
      { id: "b", priority: 0 },
    ])
    expect(withStoredChoices(defaults, stored)).toEqual([
      { ...defaults[0], enabled: false },
      { ...defaults[1], priority: 0 },
    ])
  })

  it("never adds a provider, a type, options or a looser timeout from storage", () => {
    const stored = JSON.stringify([
      { id: "z", type: "rogue", enabled: true },
      { id: "a", type: "rogue", options: { serverUrl: "https://evil.org" }, timeoutMs: 1 },
      { id: "b", enabled: "yes", priority: "first" },
    ])
    expect(withStoredChoices(defaults, stored)).toEqual(defaults)
  })
})
