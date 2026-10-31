import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { notesHarness } from "../testing/notes-harness"
import { mode, next, openComposer } from "./testing/notes-card"

async function open(members?: Parameters<typeof notesHarness>[1]) {
  const harness = notesHarness("ana", members)
  return { ...harness, dialog: await openComposer(harness.services) }
}

afterEach(cleanup)

describe("sending something on my mind", () => {
  it("saves a private draft as they write and sends it at the last step", async () => {
    const { dialog, draftsRepo, repo } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await fireEvent.change(dialog.getByLabelText("To"), { target: { value: "ben" } })
    await next(dialog)
    await fireEvent.click(dialog.getByRole("button", { name: "torn" }))
    await waitFor(() => expect(dialog.getByRole("status")).toHaveTextContent("Draft saved"))
    expect(dialog.getByRole("status")).toHaveAttribute("title", "Only you can see this")
    expect(draftsRepo.rows).toHaveLength(1)
    await next(dialog)
    await fireEvent.change(dialog.getByLabelText("How should Ben respond?"), {
      target: { value: "talk" },
    })
    await fireEvent.click(dialog.getByRole("radio", { name: "Mostly, just listen" }))
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

  it("asks for a person, back on the first step, then for words", async () => {
    const { dialog } = await open()
    await fireEvent.click(mode(dialog, "Something on my mind"))
    await next(dialog, 2)
    await fireEvent.click(dialog.getByRole("button", { name: "Send" }))
    expect(await dialog.findByRole("alert")).toHaveTextContent("Choose who this is for")
    expect(dialog.getByText("Step 1 of 3")).toBeInTheDocument()
    await fireEvent.change(dialog.getByLabelText("To"), { target: { value: "ben" } })
    await next(dialog, 2)
    await fireEvent.click(dialog.getByRole("button", { name: "Send to Ben" }))
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "Write something in at least one part",
    )
  })
})
