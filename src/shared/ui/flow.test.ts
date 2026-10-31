import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import AutosaveStatus from "./AutosaveStatus.svelte"
import CollapsibleGroup from "./CollapsibleGroup.svelte"
import Dropzone from "./Dropzone.svelte"
import StepIndicator from "./StepIndicator.svelte"
import RadioCards from "./testing/RadioCards.svelte"
import { html } from "./testing/snippet"

afterEach(cleanup)

describe("flow components", () => {
  it("steps forward and back, with no Back on the first step", async () => {
    const onnext = vi.fn()
    const onback = vi.fn()
    render(StepIndicator, { step: 1, total: 3, onnext, onback })
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull()
    await fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(onnext).toHaveBeenCalled()
    cleanup()
    render(StepIndicator, { step: 3, total: 3, onnext, onback, nextLabel: "Send" })
    await fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(onback).toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("opens a collapsed group to show the rest", async () => {
    render(CollapsibleGroup, {
      title: "Activity",
      meta: "2 new",
      children: html("<p>Ben replied</p>"),
    })
    const trigger = screen.getByRole("button", { name: /Activity/ })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Ben replied")).toBeInTheDocument()
  })

  it("hands chosen files over, one unless multiple", async () => {
    const onfiles = vi.fn()
    const { container } = render(Dropzone, { title: "No files yet", onfiles })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const files = [new File(["a"], "a.pdf"), new File(["b"], "b.pdf")]
    await fireEvent.change(input, { target: { files } })
    expect(onfiles).toHaveBeenCalledWith([files[0]])
    expect(screen.getByRole("group", { name: "No files yet" })).toBeInTheDocument()
  })

  it("says when a draft was saved", () => {
    render(AutosaveStatus, { savedAt: "2026-10-27T12:32:00Z" })
    expect(screen.getByText(/Draft saved \d\d:32/)).toBeInTheDocument()
    cleanup()
    render(AutosaveStatus, { savedAt: null, saving: true })
    expect(screen.getByText("Saving draft")).toBeInTheDocument()
  })

  it("selects one radio card at a time", async () => {
    render(RadioCards)
    const couple = screen.getByRole("radio", { name: /Couple/ })
    const friends = screen.getByRole("radio", { name: /Friends/ })
    expect(couple).toHaveAttribute("aria-checked", "true")
    await fireEvent.click(friends)
    expect(friends).toHaveAttribute("aria-checked", "true")
    expect(couple).toHaveAttribute("aria-checked", "false")
  })
})
