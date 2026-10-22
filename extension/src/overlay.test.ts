import { afterEach, describe, expect, it, vi } from "vitest"
import { mountOverlay } from "./overlay"
import type { OverlayModel } from "./overlay-model"

const model: OverlayModel = {
  heading: "Common Ground party",
  people: [{ name: "Ana", status: "Ready" }],
  line: "Waiting for everyone",
  ready: true,
  play: "start",
  canPlay: false,
  pause: false,
}

function mount() {
  const actions = { ready: vi.fn(), play: vi.fn(), pause: vi.fn() }
  const overlay = mountOverlay(document, actions)
  const buttons = () => [...overlay.root.querySelectorAll("button")]
  const named = (name: string) => buttons().find((b) => b.textContent === name)
  return { actions, overlay, buttons, named }
}

afterEach(() => document.body.replaceChildren())

describe("the in-page overlay panel", () => {
  it("shows the people and the line, and Ready is a click on the page", () => {
    const { actions, overlay, named } = mount()
    overlay.render(model)
    expect(overlay.root.textContent).toContain("AnaReady")
    expect(overlay.root.textContent).toContain("Waiting for everyone")
    expect(named("Play together")?.disabled).toBe(true)
    named("Ready")?.click()
    expect(actions.ready).toHaveBeenCalledOnce()
  })

  it("pauses and resumes for everyone", () => {
    const { actions, overlay, named } = mount()
    overlay.render({ ...model, ready: false, play: null, pause: true })
    named("Pause")?.click()
    overlay.render({ ...model, ready: false, play: "resume", canPlay: true })
    named("Resume")?.click()
    expect([actions.pause.mock.calls.length, actions.play.mock.calls.length]).toEqual([1, 1])
  })

  it("folds away to one button and back, and shows a plain message", () => {
    const { overlay, named, buttons } = mount()
    overlay.render("Sign in from the Common Ground extension")
    named("Hide")?.click()
    expect(buttons().map((b) => b.textContent)).toEqual(["Show party"])
    named("Show party")?.click()
    expect(overlay.root.textContent).toContain("Sign in from the Common Ground extension")
  })

  it("leaves the page as it found it", () => {
    const { overlay } = mount()
    expect(document.querySelector("[data-common-ground]")).not.toBeNull()
    overlay.remove()
    expect(document.querySelector("[data-common-ground]")).toBeNull()
  })
})
