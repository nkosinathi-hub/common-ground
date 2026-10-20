import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const launch = vi.hoisted(() => ({ url: undefined as string | undefined }))
const on = new Map<string, (event: unknown) => unknown>()
const listen = (name: string, fn: (event: unknown) => unknown) => {
  on.set(name, fn)
  return Promise.resolve({ remove: () => Promise.resolve() })
}
const minimizeApp = vi.fn(() => Promise.resolve())
vi.mock("@capacitor/app", () => ({
  App: { getLaunchUrl: () => Promise.resolve(launch), addListener: listen, minimizeApp },
}))
vi.mock("@capacitor/push-notifications", () => ({ PushNotifications: { addListener: listen } }))
vi.mock("./check-update", () => ({ checkForUpdate: () => Promise.resolve() }))

const { prepareLaunch, startNative } = await import("./index")
const site = "https://site.example/cg/"
const invite = `${site}app-link/#/invite/tok_1`

beforeEach(() => history.replaceState(null, "", "/"))
afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe("prepareLaunch", () => {
  it("puts the launching link in place before boot, and only once per app session", async () => {
    launch.url = invite
    await prepareLaunch(site)
    expect(location.hash).toBe("#/invite/tok_1")
    history.replaceState(null, "", "/#/account") // the user moved on, then the page reloaded
    await prepareLaunch(site)
    expect(location.hash).toBe("#/account")
  })

  it("leaves the page alone for a launch from the home screen", async () => {
    launch.url = undefined
    await prepareLaunch(site)
    expect(location.pathname + location.hash).toBe("/")
  })
})

describe("startNative", () => {
  it("reloads into a link that arrives while the app is open", () => {
    const replace = vi.fn()
    vi.stubGlobal("location", { ...location, replace, hash: "" })
    startNative(site)
    void on.get("appUrlOpen")!({ url: invite })
    expect(replace).toHaveBeenCalledWith("/#/invite/tok_1")
  })

  it("opens a tapped push's route and minimises from a root page on back", () => {
    startNative(site)
    void on.get("pushNotificationActionPerformed")!({
      notification: { data: { route: "#/account" } },
    })
    expect(location.hash).toBe("#/account")
    history.replaceState(null, "", "/")
    void on.get("backButton")!({ canGoBack: true })
    expect(minimizeApp).toHaveBeenCalledOnce()
  })
})
