import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import { mode, openComposer } from "./testing/notes-card"

async function open(members?: Parameters<typeof notesHarness>[1]) {
  const harness = notesHarness("ana", members)
  return { ...harness, dialog: await openComposer(harness.services) }
}

afterEach(cleanup)

describe("sending something on my mind", () => {
  it("saves a private draft as they write and sends it in one step", async () => {
    const { dialog, draftsRepo, repo } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await fireEvent.change(dialog.getByLabelText("To"), { target: { value: "ben" } })
    await fireEvent.input(dialog.getByLabelText("How I feel"), { target: { value: "torn" } })
    await waitFor(() => expect(dialog.getByRole("status")).toHaveTextContent("Saved"))
    expect(dialog.getByRole("status")).toHaveAttribute("title", "Only you can see this")
    expect(draftsRepo.rows).toHaveLength(1)
    await fireEvent.click(dialog.getByRole("radio", { name: "Can we talk in person?" }))
    await fireEvent.click(dialog.getByRole("button", { name: "Mostly, just listen" }))
    await fireEvent.click(dialog.getByRole("button", { name: "Send to Ben" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(draftsRepo.rows).toEqual([])
    expect(repo.rows[0]).toMatchObject({
      kind: "hard_talk",
      sections: { feel: "torn" },
      responseWish: "talk",
      supportWish: "listen",
    })
    expect(await screen.findByText("You shared something with Ben")).toBeInTheDocument()
  })

  it("asks for words and a person before sending", async () => {
    const { dialog } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await fireEvent.click(dialog.getByRole("button", { name: "Send" }))
    expect(await dialog.findByRole("alert")).toHaveTextContent("Choose who this is for")
    await fireEvent.change(dialog.getByLabelText("To"), { target: { value: "ben" } })
    await fireEvent.click(dialog.getByRole("button", { name: "Send to Ben" }))
    expect(dialog.getByRole("alert")).toHaveTextContent("Write something in at least one part")
  })
})
