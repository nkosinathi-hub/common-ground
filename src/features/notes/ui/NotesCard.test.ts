import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { NoteDraft } from "../application/notes-service"
import { inMemoryNotesService } from "../testing/notes-fixture"
import { notesContext } from "./context"
import NotesCard from "./NotesCard.svelte"

const draft = { recipientId: "ben", body: "Dinner at 7?", pinned: false, expiry: "never" } as const

/** Ana has written to Ben; `me` opens Home. */
async function setup(me = "ben", notes: NoteDraft[] = [draft]) {
  const { repo, service } = inMemoryNotesService()
  for (const note of notes) await service.send("s", note)
  repo.me = me
  let arrive = () => {}
  const arrivals = { subscribe: (cb: () => void) => ((arrive = cb), () => {}) }
  render(NotesCard, {
    props: { spaceId: "s" },
    context: notesContext({ service, arrivals, me: () => me }),
  })
  return { repo, service, arrive: () => arrive() }
}

const item = async (text: string) => (await screen.findByText(text)).closest("li") as HTMLElement

afterEach(cleanup)

describe("NotesCard", () => {
  it("highlights an unread note with text, and opening its thread reads it", async () => {
    const { repo } = await setup()
    const note = within(await item("Dinner at 7?"))
    expect(note.getByText("New")).toBeInTheDocument()
    expect(note.getByText("Unread")).toHaveClass("sr-only")
    expect(note.getByText("Ana to you")).toBeInTheDocument()
    await fireEvent.click(note.getByRole("button", { name: "Reply" }))
    expect(note.queryByText("New")).toBeNull()
    expect([...repo.reads.keys()]).toContain("note-1:ben")
  })

  it("replies in the thread", async () => {
    await setup()
    const note = within(await item("Dinner at 7?"))
    await fireEvent.click(note.getByRole("button", { name: "Reply" }))
    await fireEvent.input(await note.findByLabelText("Your reply"), { target: { value: "Yes!" } })
    await fireEvent.click(note.getByRole("button", { name: "Send reply" }))
    expect(await note.findByText("Yes!")).toBeInTheDocument()
    expect(note.getByRole("button", { name: "Replies (1)" })).toBeInTheDocument()
  })

  it("reloads when a note arrives", async () => {
    const { service, repo, arrive } = await setup("ben", [])
    expect(await screen.findByText("No notes yet.")).toBeInTheDocument()
    repo.me = "ana"
    await service.send("s", { ...draft, body: "Surprise" })
    repo.me = "ben"
    arrive()
    expect(await screen.findByText("Surprise")).toBeInTheDocument()
  })

  it("shows five notes and loads the rest on demand", async () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ ...draft, body: `Note ${i + 1}` }))
    await setup("ben", many)
    await screen.findByText("Note 6")
    expect(screen.queryByText("Note 1")).toBeNull()
    await fireEvent.click(screen.getByRole("button", { name: "Load more" }))
    expect(await screen.findByText("Note 1")).toBeInTheDocument()
  })
})
