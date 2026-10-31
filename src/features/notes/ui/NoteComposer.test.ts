import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import { openComposer } from "./testing/notes-card"

async function open() {
  const { repo, services } = notesHarness("ana")
  return { repo, dialog: await openComposer(services) }
}

afterEach(cleanup)

describe("NoteComposer", () => {
  it("offers everyone or each other member, and sends a pinned note", async () => {
    const { repo, dialog } = await open()
    await dialog.findByRole("radio", { name: "Cy" })
    expect(dialog.getAllByRole("radio").map((r) => r.textContent?.trim())).toContain("Everyone")
    await fireEvent.click(dialog.getByRole("radio", { name: "Cy" }))
    await fireEvent.input(dialog.getByLabelText("Your note"), { target: { value: "Hello Cy" } })
    expect(dialog.getByText("8 / 1,000 characters")).toBeInTheDocument()
    await fireEvent.click(dialog.getByLabelText("Pin to the top"))
    await fireEvent.change(dialog.getByLabelText("Expires"), { target: { value: "week" } })
    await fireEvent.click(dialog.getByRole("button", { name: "Send note" }))
    expect(await screen.findByText("Hello Cy")).toBeInTheDocument()
    expect(repo.rows[0]).toMatchObject({
      recipientId: "cy",
      pinned: true,
      expiresAt: expect.any(String) as string,
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("shows why a note was refused", async () => {
    const { dialog } = await open()
    await fireEvent.input(dialog.getByLabelText("Your note"), { target: { value: "   " } })
    await fireEvent.click(dialog.getByRole("button", { name: "Send note" }))
    expect(await dialog.findByRole("alert")).toHaveTextContent("Notes are 1 to 1000 characters")
  })
})
