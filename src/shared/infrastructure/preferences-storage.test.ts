import { describe, expect, it, vi } from "vitest"

const values = new Map<string, string>()
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: ({ key }: { key: string }) => Promise.resolve({ value: values.get(key) ?? null }),
    set: ({ key, value }: { key: string; value: string }) =>
      Promise.resolve(void values.set(key, value)),
    remove: ({ key }: { key: string }) => Promise.resolve(void values.delete(key)),
  },
}))

const { preferencesStorage } = await import("./preferences-storage")

describe("preferencesStorage", () => {
  it("keeps the auth session in Android Preferences, which the WebView cannot evict", async () => {
    expect(await preferencesStorage.getItem("sb-auth")).toBeNull()
    await preferencesStorage.setItem("sb-auth", "{}")
    expect(await preferencesStorage.getItem("sb-auth")).toBe("{}")
    await preferencesStorage.removeItem("sb-auth")
    expect(await preferencesStorage.getItem("sb-auth")).toBeNull()
  })
})
