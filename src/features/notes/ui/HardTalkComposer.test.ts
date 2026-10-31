import { cleanup, fireEvent } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import { mode, next, openComposer } from "./testing/notes-card"

async function open(members?: Parameters<typeof notesHarness>[1]) {
  const harness = notesHarness("ana", members)
  return { ...harness, dialog: await openComposer(harness.services) }
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("one composer for both kinds of note", () => {
  it("starts as a quick note and keeps the words when switching either way", async () => {
    const { dialog } = await open()
    expect(mode(dialog, "Quick note")).toHaveAttribute("aria-checked", "true")
    await fireEvent.input(dialog.getByLabelText("Your note"), { target: { value: "About Sunday" } })
    await fireEvent.click(mode(dialog, "Something on my mind"))
    expect(dialog.getByLabelText("What's on my mind")).toHaveValue("About Sunday")
    expect(dialog.getByText("Step 1 of 3")).toBeInTheDocument()
    expect(dialog.queryByRole("option", { name: "Everyone" })).toBeNull()
    await fireEvent.click(mode(dialog, "Quick note"))
    expect(dialog.getByLabelText("Your note")).toHaveValue("About Sunday")
  })

  it("walks the three steps there and back", async () => {
    const { dialog } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await next(dialog)
    expect(dialog.getByText("Step 2 of 3")).toBeInTheDocument()
    expect(dialog.getByLabelText("In my own words")).toBeInTheDocument()
    await next(dialog)
    expect(dialog.getByLabelText("What would help")).toBeInTheDocument()
    expect(dialog.getByLabelText(/How should .* respond\?/)).toBeInTheDocument()
    await fireEvent.click(dialog.getByRole("button", { name: "Back" }))
    expect(dialog.getByText("Step 2 of 3")).toBeInTheDocument()
  })

  it("preselects the partner when there are two of you", async () => {
    const two = [
      { id: "ana", displayName: "Ana" },
      { id: "ben", displayName: "Ben" },
    ]
    const { dialog } = await open(two)
    await dialog.findByRole("radio", { name: "Ben" })
    await fireEvent.click(mode(dialog, "Something on my mind"))
    expect(dialog.getByLabelText("To")).toHaveValue("ben")
    await next(dialog, 2)
    expect(dialog.getByRole("button", { name: "Send to Ben" })).toBeInTheDocument()
  })

  it("picks feeling words as chips beside the writer's own", async () => {
    const { dialog } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await next(dialog)
    await fireEvent.click(dialog.getByRole("button", { name: "left out" }))
    await fireEvent.input(dialog.getByLabelText("In my own words"), { target: { value: "unseen" } })
    expect(dialog.getByRole("button", { name: "Remove left out" })).toBeInTheDocument()
    expect(dialog.queryByRole("button", { name: "left out" })).toBeNull()
    expect(dialog.getByLabelText("In my own words")).toHaveValue("unseen")
  })
})
