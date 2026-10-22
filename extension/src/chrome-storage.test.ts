import { describe, expect, it } from "vitest"
import { activeParty, chromeStorage, setActiveParty, type StorageArea } from "./chrome-storage"

/** chrome.storage.local in memory. */
function fakeArea(): StorageArea & { items: Record<string, unknown> } {
  const items: Record<string, unknown> = {}
  return {
    items,
    get: (key) => Promise.resolve(key in items ? { [key]: items[key] } : {}),
    set: (values) => Promise.resolve(void Object.assign(items, values)),
    remove: (key) => Promise.resolve(void delete items[key]),
  }
}

describe("chrome.storage.local for the extension", () => {
  it("keeps the Common Ground session where the popup and the content script both read it", async () => {
    const area = fakeArea()
    const storage = chromeStorage(area)
    expect(await storage.getItem("sb-auth")).toBeNull()
    await storage.setItem("sb-auth", "{}")
    expect(await storage.getItem("sb-auth")).toBe("{}")
    await storage.removeItem("sb-auth")
    expect(area.items).toEqual({})
  })

  it("ignores a stored value that is not text", async () => {
    const area = fakeArea()
    area.items["sb-auth"] = 42
    expect(await chromeStorage(area).getItem("sb-auth")).toBeNull()
  })

  it("remembers the party the member joined, until they leave it", async () => {
    const area = fakeArea()
    expect(await activeParty(area)).toBeNull()
    await setActiveParty(area, "p1")
    expect(await activeParty(area)).toBe("p1")
    await setActiveParty(area, null)
    expect(await activeParty(area)).toBeNull()
  })
})
