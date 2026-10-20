import { describe, expect, it } from "vitest"
import type { DeviceStore } from "@/shared/domain"
import { browserMemory } from "./view-memory"

const store = (): DeviceStore => {
  const data = new Map<string, string>()
  return {
    read: (key) => data.get(key) ?? null,
    write: (key, value) => void (value === null ? data.delete(key) : data.set(key, value)),
  }
}

describe("browserMemory", () => {
  it("remembers the view per device and the month per space", () => {
    const memory = browserMemory(store())
    expect(memory.view()).toBeNull()
    memory.saveView("month")
    memory.saveMonth("s1", { year: 2026, month: 11 })
    expect(memory.view()).toBe("month")
    expect(memory.month("s1")).toEqual({ year: 2026, month: 11 })
    expect(memory.month("s2")).toBeNull()
  })

  it("ignores junk left in storage", () => {
    const junk = store()
    junk.write("calendar.view", "week")
    junk.write("calendar.month.s1", "2026-13")
    expect(browserMemory(junk).view()).toBeNull()
    expect(browserMemory(junk).month("s1")).toBeNull()
  })
})
