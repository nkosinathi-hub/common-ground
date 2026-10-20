import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ receive: "prompt", afterAsk: "granted" }))
const listeners = new Map<string, (event: unknown) => void>()
const plugin = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  createChannel: vi.fn(() => Promise.resolve()),
  register: vi.fn(() => Promise.resolve()),
  unregister: vi.fn(() => Promise.resolve()),
  addListener: vi.fn(),
}))
vi.mock("@capacitor/push-notifications", () => ({ PushNotifications: plugin }))
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (name: string, fn: (event: unknown) => void) => {
      listeners.set(name, fn)
      return Promise.resolve({ remove: () => Promise.resolve() })
    },
  },
}))

const { startPush } = await import("./push")
const devices = { register: vi.fn(), unregister: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  listeners.clear()
  plugin.checkPermissions.mockImplementation(() => Promise.resolve({ receive: state.receive }))
  plugin.requestPermissions.mockImplementation(() => Promise.resolve({ receive: state.afterAsk }))
  plugin.addListener.mockImplementation((name: string, fn: (event: unknown) => void) => {
    listeners.set(name, fn)
    return Promise.resolve({ remove: () => Promise.resolve() })
  })
  devices.register.mockResolvedValue({ ok: true, value: undefined })
  devices.unregister.mockResolvedValue({ ok: true, value: undefined })
})

describe("startPush", () => {
  it("asks once, registers with FCM and keeps the token on the server", async () => {
    state.receive = "prompt"
    await startPush(devices)
    expect(plugin.requestPermissions).toHaveBeenCalledOnce()
    expect(plugin.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: "updates" }))
    listeners.get("registration")!({ value: "tok" })
    await vi.waitFor(() => expect(devices.register).toHaveBeenCalledWith("tok"))
  })

  it("forgets the token on sign-out, before the session ends", async () => {
    state.receive = "granted"
    const push = await startPush(devices)
    listeners.get("registration")!({ value: "tok" })
    await push.forget()
    expect(devices.unregister).toHaveBeenCalledWith("tok")
    expect(plugin.unregister).toHaveBeenCalledOnce()
  })

  it("tries again when the app resumes if saving the token failed", async () => {
    state.receive = "granted"
    devices.register.mockResolvedValueOnce({ ok: false, error: { kind: "network" } })
    await startPush(devices)
    listeners.get("registration")!({ value: "tok" })
    await vi.waitFor(() => expect(devices.register).toHaveBeenCalledOnce())
    listeners.get("resume")!({})
    await vi.waitFor(() => expect(devices.register).toHaveBeenCalledTimes(2))
    listeners.get("resume")!({})
    expect(devices.register).toHaveBeenCalledTimes(2)
  })

  it("waits for a save in flight before forgetting, so the forget lands last", async () => {
    state.receive = "granted"
    const order: string[] = []
    devices.register.mockImplementationOnce(
      () =>
        new Promise((done) =>
          setTimeout(() => done((order.push("register"), { ok: true, value: undefined })), 5),
        ),
    )
    devices.unregister.mockImplementationOnce(() => Promise.resolve(void order.push("unregister")))
    const push = await startPush(devices)
    listeners.get("registration")!({ value: "tok" })
    await push.forget()
    expect(order).toEqual(["register", "unregister"])
  })

  it("does nothing when notifications are refused", async () => {
    state.receive = "prompt"
    state.afterAsk = "denied"
    const push = await startPush(devices)
    expect(plugin.register).not.toHaveBeenCalled()
    await push.forget()
    expect(devices.unregister).not.toHaveBeenCalled()
    state.afterAsk = "granted"
  })
})
