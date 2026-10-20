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
