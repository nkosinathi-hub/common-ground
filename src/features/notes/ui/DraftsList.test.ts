import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { EMPTY_DRAFT } from "../domain"
import { notesHarness } from "../testing/notes-harness"
import { COMPOSER, mode, next, openComposer, renderNotesCard } from "./testing/notes-card"

async function withDraft() {
  const harness = notesHarness("ana")
  const fields = { ...EMPTY_DRAFT, recipientId: "ben", sections: { happened: "Sunday" } }
  await harness.drafts.save("s", null, fields)
  renderNotesCard(harness.services)
  return harness
}

afterEach(cleanup)

describe("Your drafts", () => {
  it("lists my drafts by who they are for, and resumes one in the same composer", async () => {
    const { draftsRepo } = await withDraft()
    const drafts = within(await screen.findByRole("region", { name: "Your drafts (1)" }))
    await fireEvent.click(drafts.getByRole("button", { name: /^To Ben · edited/ }))
    const dialog = within(await screen.findByRole("dialog", { name: COMPOSER }))
    expect(dialog.getByRole("radio", { name: "Something on my mind" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    expect(dialog.getByLabelText("What's on my mind")).toHaveValue("Sunday")
    await next(dialog, 2)
    await fireEvent.input(dialog.getByLabelText("What would help"), { target: { value: "Time" } })
    await fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(draftsRepo.rows[0]?.sections).toMatchObject({ help: "Time" }))
    expect(draftsRepo.rows).toHaveLength(1)
  })

  it("deletes a draft after asking", async () => {
    const { draftsRepo } = await withDraft()
    await fireEvent.click(await screen.findByRole("button", { name: /^To Ben/ }))
    const dialog = within(await screen.findByRole("dialog", { name: COMPOSER }))
    await fireEvent.click(dialog.getByRole("button", { name: "Delete draft" }))
    const confirm = within(await screen.findByRole("alertdialog", { name: "Delete this draft?" }))
    expect(confirm.getByText("It can't be brought back.")).toBeInTheDocument()
    await fireEvent.click(confirm.getByRole("button", { name: "Delete draft" }))
    await waitFor(() => expect(draftsRepo.rows).toEqual([]))
    await waitFor(() => expect(screen.queryByRole("region", { name: /Your drafts/ })).toBeNull())
  })

  it("sending a quick note from a draft takes the draft with it", async () => {
    const { draftsRepo } = await withDraft()
    await fireEvent.click(await screen.findByRole("button", { name: /^To Ben/ }))
    const dialog = within(await screen.findByRole("dialog", { name: COMPOSER }))
    await fireEvent.click(dialog.getByRole("radio", { name: "Quick note" }))
    await fireEvent.click(dialog.getByRole("button", { name: "Send note" }))
    expect(await screen.findByText("Sunday")).toBeInTheDocument()
    expect(draftsRepo.rows).toEqual([])
  })

  it("shows a save that failed, and closing saves and lists the draft", async () => {
    const harness = notesHarness("ana")
    harness.draftsRepo.failSaves = true
    const dialog = await openComposer(harness.services)
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await next(dialog)
    await fireEvent.click(dialog.getByRole("button", { name: "sad" }))
    await waitFor(() =>
      expect(dialog.getByRole("status")).toHaveTextContent("Couldn't save. Trying again"),
    )
    harness.draftsRepo.failSaves = false
    await fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    expect(await screen.findByRole("region", { name: "Your drafts (1)" })).toBeInTheDocument()
  })
})
