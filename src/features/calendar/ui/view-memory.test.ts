import { describe, expect, it } from "vitest"
import { browserMemory } from "./view-memory"

const storage = () => {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as Storage
}

describe("browserMemory", () => {
  it("remembers the view per device and the month per space", () => {
    const memory = browserMemory(storage())
    expect(memory.view()).toBeNull()
    memory.saveView("month")
    memory.saveMonth("s1", { year: 2026, month: 11 })
    expect(memory.view()).toBe("month")
    expect(memory.month("s1")).toEqual({ year: 2026, month: 11 })
    expect(memory.month("s2")).toBeNull()
  })

  it("ignores junk and survives storage that throws", () => {
    const junk = storage()
    junk.setItem("cg.calendar.view", "week")
    junk.setItem("cg.calendar.month.s1", "2026-13")
    expect(browserMemory(junk).view()).toBeNull()
    expect(browserMemory(junk).month("s1")).toBeNull()
    const broken = browserMemory(() => {
      throw new Error("blocked")
    })
    expect(broken.view()).toBeNull()
    expect(broken.month("s1")).toBeNull()
    expect(() => broken.saveView("agenda")).not.toThrow()
    expect(() => broken.saveMonth("s1", { year: 2026, month: 1 })).not.toThrow()
  })
})
