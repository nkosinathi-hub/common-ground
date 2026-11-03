import { afterEach, describe, expect, it, vi } from "vitest"
import { focusFirstField } from "./focus"

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe("dialog focus intent", () => {
  function open(touch: boolean) {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: touch })),
    )
    const body = document.createElement("div")
    const label = document.createElement("label"),
      input = document.createElement("input")
    label.append("Title", input)
    body.append(label)
    document.body.append(body)
    const event = new Event("openAutoFocus", { cancelable: true })
    return { body, event, input }
  }
  it("leaves touch focus to the dialog close control instead of opening the keyboard", () => {
    const { body, event, input } = open(true)
    expect(focusFirstField(body, event)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(input).not.toHaveFocus()
  })
  it("retains immediate typing for mouse and keyboard users", () => {
    const { body, event, input } = open(false)
    expect(focusFirstField(body, event)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(input).toHaveFocus()
  })
  it("uses the default dialog target when there is no enabled field", () => {
    const { event } = open(false)
    expect(focusFirstField(undefined, event)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })
})
