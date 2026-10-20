import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { sharedHarness } from "../testing/notes-harness"
import { renderNotesCard } from "./testing/notes-card"

async function setup(me: string) {
  const harness = await sharedHarness(me)
  renderNotesCard(harness.services)
  return harness
}

async function read() {
  await fireEvent.click(await screen.findByRole("button", { name: "Open" }))
  return within(await screen.findByRole("dialog", { name: "From Ana" }))
}

afterEach(cleanup)

describe("reading something shared with you", () => {
  it("shows an envelope in the Notes card, never the words", async () => {
    await setup("ben")
    const item = within((await screen.findByText("Ana shared something with you")).closest("li")!)
    expect(item.getByText("New")).toBeInTheDocument()
    expect(item.getByText("Take your time.")).toBeInTheDocument()
    expect(screen.queryByText("Sunday dinner")).toBeNull()
  })

  it("shows the parts written, the wish lines, and reading it clears New", async () => {
    const { repo } = await setup("ben")
    const reader = await read()
    expect(reader.getByText("Take your time. There's no rush to respond.")).toBeInTheDocument()
    expect(reader.getByText("Sunday dinner")).toBeInTheDocument()
    expect(reader.getByRole("heading", { name: "What would help" })).toBeInTheDocument()
    expect(reader.queryByRole("heading", { name: "How I feel" })).toBeNull()
    expect(
      reader.getByText("Ana would like to talk about this in person, when you're both ready."),
    ).toBeInTheDocument()
    expect(reader.getByText("Right now Ana mostly wants to be heard.")).toBeInTheDocument()
    await waitFor(() => expect(repo.reads.has("note-1:ben")).toBe(true))
  })

  it("asks about a reminder after I need a little time", async () => {
    const { hardTalkRepo } = await setup("ben")
    const reader = await read()
    await fireEvent.click(
      reader.getByRole("button", { name: "I need a little time. I'll come back to this" }),
    )
    expect(reader.getByText("Want a gentle reminder?")).toBeInTheDocument()
    await fireEvent.click(reader.getByRole("button", { name: "In 3 days" }))
    await waitFor(() => expect(hardTalkRepo.reminders).toEqual([{ noteId: "note-1", days: 3 }]))
    await waitFor(() =>
      expect(reader.getByRole("status")).toHaveTextContent("Sent: I need a little time"),
    )
  })

  it("closing before choosing still sends I need a little time", async () => {
    const { repo } = await setup("ben")
    const reader = await read()
    await fireEvent.click(reader.getByRole("button", { name: /I need a little time/ }))
    await fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(repo.responses.map((r) => r.kind)).toEqual(["time"]))
  })

  it("shows the talk tip after Let's talk, and the reply box on request", async () => {
    await setup("ben")
    const reader = await read()
    await fireEvent.click(reader.getByRole("button", { name: "Let's talk" }))
    expect(await reader.findByText(/take turns listening first/)).toBeInTheDocument()
    await fireEvent.click(reader.getByRole("button", { name: "Add a few words (optional)" }))
    expect(await reader.findByLabelText("Your reply")).toBeInTheDocument()
  })
})
