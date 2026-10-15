import { describe, expect, it } from "vitest"
import { ComposerState } from "./composer.svelte"

const members = [
  { id: "me", displayName: "Nkosi" },
  { id: "b", displayName: "Zola" },
  { id: "c", displayName: "Anele" },
]

describe("ComposerState", () => {
  it("opens the picker on @ instead of writing it into the text", () => {
    const composer = new ComposerState()
    expect(composer.handleKey("a")).toBe(false)
    expect(composer.pickerOpen).toBe(false)
    expect(composer.handleKey("@")).toBe(true)
    expect(composer.pickerOpen).toBe(true)
    expect(composer.body).toBe("")
  })

  it("stores chosen members as ids and filters what is left to choose", () => {
    const composer = new ComposerState()
    composer.openPicker()
    composer.query = "o"
    expect(composer.candidates(members, "me").map((m) => m.id)).toEqual(["b"])
    composer.choose("b")
    expect(composer.mentionIds).toEqual(["b"])
    expect(composer.pickerOpen).toBe(false)
    expect(composer.query).toBe("")
    composer.choose("b")
    expect(composer.mentionIds).toEqual(["b"])
    expect(composer.candidates(members, "me").map((m) => m.id)).toEqual(["c"])
    composer.unmention("b")
    expect(composer.mentionIds).toEqual([])
  })

  it("closes the picker and resets after sending", () => {
    const composer = new ComposerState()
    composer.openPicker()
    composer.closePicker()
    expect(composer.pickerOpen).toBe(false)
    composer.body = "Hi"
    composer.spoiler = true
    composer.choose("c")
    expect(composer.draft).toEqual({ body: "Hi", spoiler: true, mentionIds: ["c"] })
    composer.reset()
    expect(composer.draft).toEqual({ body: "", spoiler: false, mentionIds: [] })
  })
})
