import { describe, expect, it } from "vitest"
import { inMemoryNotesService } from "../testing/notes-fixture"
import { NotesState } from "./notes.svelte"

const draft = { recipientId: null, body: "Pizza?", pinned: false, expiry: "never" } as const

const setup = () => {
  const fixture = inMemoryNotesService()
  return { ...fixture, notes: new NotesState(fixture.service, () => "s") }
}

describe("NotesState", () => {
  it("sends a note to the top of the list", async () => {
    const { notes } = setup()
    await notes.load()
    expect(await notes.send(draft)).toBeNull()
    expect(await notes.send({ ...draft, body: "" })).toMatchObject({ field: "body" })
    expect(notes.visible.map((n) => n.body)).toEqual(["Pizza?"])
  })

  it("marks a note read at once and on the server", async () => {
    const { notes, repo, service } = setup()
    await service.send("s", draft)
    repo.me = "ben"
    await notes.load()
    const [note] = notes.visible
    expect(note?.readAt).toBeNull()
    await notes.markRead(note!)
    expect(notes.visible[0]?.readAt).not.toBeNull()
    expect(repo.reads.has(`${note!.id}:ben`)).toBe(true)
  })

  it("counts a reply on its note and keeps the note read", async () => {
    const { notes, repo, service } = setup()
    await service.send("s", draft)
    repo.me = "ben"
    await notes.load()
    const reply = await notes.reply(notes.visible[0]!, "Yes")
    expect(reply.ok).toBe(true)
    expect(notes.visible[0]).toMatchObject({ replyCount: 1, readAt: expect.any(String) })
    expect(await notes.reply(notes.visible[0]!, " ")).toMatchObject({ ok: false })
  })
})
