import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import { notesContext } from "./context"
import NotesCard from "./NotesCard.svelte"

async function open() {
  const { repo, services } = notesHarness("ana")
  render(NotesCard, { props: { spaceId: "s" }, context: notesContext(services) })
  await fireEvent.click(await screen.findByRole("button", { name: "Write a note" }))
  return { repo, dialog: within(await screen.findByRole("dialog", { name: "Write a note" })) }
}

afterEach(cleanup)

describe("NoteComposer", () => {
  it("offers everyone or each other member, and sends a pinned note", async () => {
    const { repo, dialog } = await open()
    const to = dialog.getByLabelText("To") as HTMLSelectElement
    await screen.findByRole("option", { name: "Cy" })
    expect([...to.options].map((o) => o.text)).toEqual(["Everyone", "Ben", "Cy"])
    await fireEvent.change(to, { target: { value: "cy" } })
    await fireEvent.input(dialog.getByLabelText("Note"), { target: { value: "Hello Cy" } })
    expect(dialog.getByText("8 / 1000")).toBeInTheDocument()
    await fireEvent.click(dialog.getByLabelText("Pin to the top"))
    await fireEvent.change(dialog.getByLabelText("Expires"), { target: { value: "week" } })
    await fireEvent.click(dialog.getByRole("button", { name: "Send" }))
    expect(await screen.findByText("Hello Cy")).toBeInTheDocument()
    expect(repo.rows[0]).toMatchObject({
      recipientId: "cy",
      pinned: true,
      expiresAt: expect.any(String),
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("shows why a note was refused", async () => {
    const { dialog } = await open()
    await fireEvent.input(dialog.getByLabelText("Note"), { target: { value: "   " } })
    await fireEvent.click(dialog.getByRole("button", { name: "Send" }))
    expect(await dialog.findByRole("alert")).toHaveTextContent("Notes are 1 to 1000 characters")
  })
})
