import { describe, expect, it } from "vitest"
import { DeviceCredentials, type KeyValue } from "./device-credentials"

function memory(): KeyValue & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => void data.set(key, value),
    remove: async (key) => void data.delete(key),
  }
}

const credential = { token: "t", userId: "u", deviceId: "d" }

describe("DeviceCredentials", () => {
  it("keeps a credential per provider under a playback key, and forgets it", async () => {
    const kv = memory()
    const store = new DeviceCredentials(kv)
    await store.set("jellyfin", credential)
    expect([...kv.data.keys()]).toEqual(["playback-credential:jellyfin"])
    expect(await store.get("jellyfin")).toEqual(credential)
    expect(await store.get("other")).toBeNull()
    await store.clear("jellyfin")
    expect(await store.get("jellyfin")).toBeNull()
  })

  it("answers null for a damaged entry", async () => {
    const kv = memory()
    kv.data.set("playback-credential:a", "{oops")
    kv.data.set("playback-credential:b", JSON.stringify({ token: 1 }))
    const store = new DeviceCredentials(kv)
    expect(await store.get("a")).toBeNull()
    expect(await store.get("b")).toBeNull()
  })
})
