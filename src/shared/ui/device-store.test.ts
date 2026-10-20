import { afterEach, describe, expect, it, vi } from "vitest"
import { clearDeviceData, deviceStore } from "./device-store"

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe("device store", () => {
  it("keeps values under the app prefix, per storage area", () => {
    deviceStore().write("active-space", "s1")
    deviceStore("session").write("pending-invite", "t1")
    expect(localStorage.getItem("common-ground:active-space")).toBe("s1")
    expect(sessionStorage.getItem("common-ground:pending-invite")).toBe("t1")
    expect(deviceStore().read("active-space")).toBe("s1")
    deviceStore().write("active-space", null)
    expect(deviceStore().read("active-space")).toBeNull()
  })

  it("never fails when storage throws", () => {
    for (const method of ["getItem", "setItem", "removeItem", "key"] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error("blocked")
      })
    }
    expect(deviceStore().read("x")).toBeNull()
    expect(() => deviceStore().write("x", "1")).not.toThrow()
    expect(() => clearDeviceData()).not.toThrow()
  })

  it("forgets everything the app stored on sign-out, and keeps the theme", () => {
    deviceStore().write("capture-draft:s1", "a private idea")
    deviceStore("session").write("pending-invite", "t1")
    localStorage.setItem("cg.calendar.view", "agenda")
    localStorage.setItem("mode-watcher-mode", "dark")
    clearDeviceData()
    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem("mode-watcher-mode")).toBe("dark")
    expect(sessionStorage.length).toBe(0)
  })
})
