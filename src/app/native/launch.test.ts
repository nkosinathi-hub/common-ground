import { describe, expect, it } from "vitest"
import type { DeviceStore } from "@/shared/domain"
import { firstTime } from "./launch"

function memory(): DeviceStore {
  const values = new Map<string, string>()
  return {
    read: (key) => values.get(key) ?? null,
    write: (key, value) => (value === null ? values.delete(key) : values.set(key, value)),
  }
}

describe("firstTime", () => {
  it("lets each link through once, so a reload never replays it", () => {
    const store = memory()
    expect(firstTime(store, "https://a/?code=1")).toBe(true)
    expect(firstTime(store, "https://a/?code=1")).toBe(false)
  })

  it("remembers an older link while a newer one opens", () => {
    const store = memory()
    firstTime(store, "https://a/?code=1")
    expect(firstTime(store, "https://a/#/invite/t")).toBe(true)
    expect(firstTime(store, "https://a/?code=1")).toBe(false)
  })

  it("keeps only the most recent links", () => {
    const store = memory()
    for (let i = 0; i < 12; i++) firstTime(store, `https://a/?code=${i}`)
    expect(firstTime(store, "https://a/?code=0")).toBe(true)
    expect(firstTime(store, "https://a/?code=11")).toBe(false)
  })

  it("treats unreadable memory as empty", () => {
    const store = memory()
    store.write("opened-links", "{oops")
    expect(firstTime(store, "https://a/")).toBe(true)
  })
})
