import { afterEach, describe, expect, it, vi } from "vitest"

const info = vi.fn()
vi.mock("svelte-sonner", () => ({ toast: { info } }))
vi.mock("@capacitor/app", () => ({ App: { getInfo: () => Promise.resolve({ version: "0.4.0" }) } }))
vi.mock("@capacitor/browser", () => ({ Browser: { open: vi.fn() } }))

const { checkForUpdate } = await import("./check-update")
const site = "https://site.example/cg/"

function serve(body: unknown, ok = true) {
  const fetch = vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) }))
  vi.stubGlobal("fetch", fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
  info.mockClear()
})

describe("checkForUpdate", () => {
  it("offers a newer APK from the website's app folder", async () => {
    const fetch = serve({ version: "0.4.1", apk: "common-ground.apk" })
    await checkForUpdate(site)
    expect(fetch).toHaveBeenCalledWith("https://site.example/cg/app/version.json", {
      cache: "no-store",
    })
    expect(info).toHaveBeenCalledWith("Common Ground 0.4.1 is ready", expect.anything())
  })

  it("stays quiet when the app is up to date or the file is missing", async () => {
    serve({ version: "0.4.0", apk: "common-ground.apk" })
    await checkForUpdate(site)
    serve({}, false)
    await checkForUpdate(site)
    expect(info).not.toHaveBeenCalled()
  })

  it("stays quiet offline", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("offline")))
    await expect(checkForUpdate(site)).resolves.toBeUndefined()
  })
})
