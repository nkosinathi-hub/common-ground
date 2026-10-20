import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { sharedHarness } from "../testing/notes-harness"
import { renderNotesCard } from "./testing/notes-card"

async function setup(me: string) {
  const harness = await sharedHarness(me)
  renderNotesCard(harness.services)
  return harness
}

afterEach(cleanup)

describe("the author's side", () => {
  it("shows the status, then the latest response, and can take it back", async () => {
    const { repo, hardTalk } = await setup("ana")
    const item = () => screen.getByText("You shared something with Ben").closest("li")!
    expect(await screen.findByText("No rush. Ben hasn't responded yet")).toBeInTheDocument()
    repo.me = "ben"
    await hardTalk.respond("note-1", "here")
    repo.me = "ana"
    await fireEvent.click(within(item()).getByRole("button", { name: "Read what you shared" }))
    const reader = within(await screen.findByRole("dialog", { name: "What you shared with Ben" }))
    expect(reader.getByText("Sunday dinner")).toBeInTheDocument()
    expect(reader.queryByRole("button", { name: "Let's talk" })).toBeNull()
    await fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await fireEvent.click(within(item()).getByRole("button", { name: "Take it back" }))
    const confirm = within(await screen.findByRole("alertdialog", { name: "Take this back?" }))
    await fireEvent.click(confirm.getByRole("button", { name: "Take it back" }))
    await waitFor(() => expect(repo.rows).toEqual([]))
  })
})
