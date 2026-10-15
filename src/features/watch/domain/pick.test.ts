import { describe, expect, it } from "vitest"
import { item } from "../testing/fixtures"
import { pickForUs, togetherQueue } from "./pick"

const a = item(1, "A", { intent: "watch_together" })
const b = item(2, "B", { intent: "watch_together" })
const c = item(3, "C", { intent: "watch_together" })
const solo = item(4, "Solo", { intent: "want_to_watch" })

describe("pickForUs", () => {
  it("keeps only the watch-together queue", () => {
    expect(togetherQueue([a, solo, b]).map((i) => i.title)).toEqual(["A", "B"])
  })

  it("returns nothing for an empty queue", () => {
    expect(pickForUs([], () => 0.5)).toBeNull()
    expect(pickForUs([solo], () => 0.5)).toBeNull()
  })

  it("chooses with the injected random number", () => {
    expect(pickForUs([a, b, c], () => 0)?.title).toBe("A")
    expect(pickForUs([a, b, c], () => 0.5)?.title).toBe("B")
    expect(pickForUs([a, b, c], () => 0.9999)?.title).toBe("C")
  })

  it("never repeats the previous pick on retry when there is a choice", () => {
    expect(pickForUs([a, b, c], () => 0, a.id)?.title).toBe("B")
    expect(pickForUs([a, b], () => 0.9, b.id)?.title).toBe("A")
    expect(pickForUs([a], () => 0.3, a.id)?.title).toBe("A")
  })

  it("survives a random source that returns 1", () => {
    expect(pickForUs([a, b], () => 1)?.title).toBe("B")
  })
})
