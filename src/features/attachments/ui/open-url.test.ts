import { afterEach, describe, expect, it, vi } from "vitest"

const native = vi.hoisted(() => ({ on: false }))
const open = vi.fn(() => Promise.resolve())
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native.on } }))
vi.mock("@capacitor/browser", () => ({ Browser: { open } }))

const { openUrl } = await import("./open-url")

afterEach(() => vi.restoreAllMocks())

describe("openUrl", () => {
  it("follows a plain link on the web", () => {
    native.on = false
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    openUrl("https://files.example/a.pdf")
    expect((click.mock.contexts[0] as HTMLAnchorElement).href).toBe("https://files.example/a.pdf")
    expect(open).not.toHaveBeenCalled()
  })

  it("opens a browser tab in the Android app, leaving the app where it was", () => {
    native.on = true
    openUrl("https://files.example/a.pdf")
    expect(open).toHaveBeenCalledWith({ url: "https://files.example/a.pdf" })
  })
})
