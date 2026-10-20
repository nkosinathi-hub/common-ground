import { describe, expect, it } from "vitest"
import type { DeviceStore } from "@/shared/domain"
import { captionPreference } from "./caption-pref"

function store(): DeviceStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    read: (key) => data.get(key) ?? null,
    write: (key, value) => (value === null ? data.delete(key) : data.set(key, value)),
  }
}

describe("captionPreference", () => {
  it("is off with no language until this person chooses", () => {
    expect(captionPreference(store()).read()).toEqual({ on: false, language: null })
  })

  it("remembers captions on, and the language, per person on this device", () => {
    const device = store()
    captionPreference(device).write({ on: true, language: "eng" })
    expect(captionPreference(device).read()).toEqual({ on: true, language: "eng" })
    expect([...device.data.keys()]).toEqual(["playback-captions"])
  })

  it("ignores a damaged value", () => {
    const device = store()
    device.data.set("playback-captions", "{oops")
    expect(captionPreference(device).read()).toEqual({ on: false, language: null })
    device.data.set("playback-captions", JSON.stringify({ on: "yes", language: 4 }))
    expect(captionPreference(device).read()).toEqual({ on: false, language: null })
  })
})
