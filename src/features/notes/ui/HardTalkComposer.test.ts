import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideNotes } from "./context"
import NotesCard from "./NotesCard.svelte"

async function open(members?: Parameters<typeof notesHarness>[1]) {
  const harness = notesHarness("ana", members)
  render(Provided, {
    props: {
      provide: () => provideNotes(harness.services),
      component: NotesCard,
      props: { spaceId: "s" },
    },
  })
  await fireEvent.click(await screen.findByRole("button", { name: "Write a note" }))
  const dialog = within(await screen.findByRole("dialog", { name: "Write a note" }))
  return { ...harness, dialog }
}

const mode = (dialog: ReturnType<typeof within>, name: string) =>
  dialog.getByRole("radio", { name })

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("one composer for both kinds of note", () => {
  it("starts as a quick note and keeps the words when switching either way", async () => {
    const { dialog } = await open()
    expect(mode(dialog, "A quick note")).toHaveAttribute("aria-checked", "true")
    await fireEvent.input(dialog.getByLabelText("Note"), { target: { value: "About Sunday" } })
    await fireEvent.click(mode(dialog, "Something on my mind"))
    expect(dialog.getByLabelText("What's on my mind")).toHaveValue("About Sunday")
    expect(dialog.getByLabelText("How I feel")).toBeInTheDocument()
    expect(dialog.getByRole("group", { name: "How I'd like you to respond" })).toBeInTheDocument()
    expect(dialog.queryByRole("option", { name: "Everyone" })).toBeNull()
    await fireEvent.click(mode(dialog, "A quick note"))
    expect(dialog.getByLabelText("Note")).toHaveValue("About Sunday")
  })

  it("moves between the two choices with the arrow keys", async () => {
    const { dialog } = await open()
    await fireEvent.keyDown(mode(dialog, "A quick note"), { key: "ArrowRight" })
    expect(mode(dialog, "Something on my mind")).toHaveAttribute("aria-checked", "true")
    expect(mode(dialog, "Something on my mind")).toHaveFocus()
    await fireEvent.keyDown(mode(dialog, "Something on my mind"), { key: "ArrowLeft" })
    expect(mode(dialog, "A quick note")).toHaveAttribute("tabindex", "0")
  })

  it("preselects the partner when there are two of you", async () => {
    const two = [
      { id: "ana", displayName: "Ana" },
      { id: "ben", displayName: "Ben" },
    ]
    const { dialog } = await open(two)
    await dialog.findByRole("option", { name: "Ben" })
    await fireEvent.click(mode(dialog, "Something on my mind"))
    expect(dialog.getByLabelText("To")).toHaveValue("ben")
    expect(dialog.getByRole("button", { name: "Send to Ben" })).toBeInTheDocument()
  })

  it("adds a feeling word, and the tip goes once dismissed", async () => {
    const { dialog } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await fireEvent.click(dialog.getByRole("button", { name: "Need a word?" }))
    await fireEvent.click(dialog.getByRole("button", { name: "left out" }))
    expect(dialog.getByLabelText("How I feel")).toHaveValue("left out")
    expect(dialog.getByRole("complementary", { name: "Tip" })).toHaveTextContent(
      'Starting with "I"',
    )
    await fireEvent.click(dialog.getByRole("button", { name: "Got it" }))
    expect(dialog.queryByRole("complementary", { name: "Tip" })).toBeNull()
    expect(localStorage.getItem("cg.notes.iTip")).toBe("1")
  })
})
