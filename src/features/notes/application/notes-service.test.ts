import { describe, expect, it } from "vitest"
import { inMemoryNotesService } from "../testing/notes-fixture"

const setup = () => inMemoryNotesService()

describe("NotesService", () => {
  it("sends a note to one member and names both people", async () => {
    const { service, repo } = setup()
    const sent = await service.send("s", {
      recipientId: "ben",
      body: " Hi ",
      pinned: true,
      expiry: "day",
    })
    expect(sent).toMatchObject({
      ok: true,
      value: {
        body: "Hi",
        authorName: "Ana",
        recipient: { kind: "member", id: "ben", name: "Ben" },
      },
    })
    expect(repo.rows[0]?.expiresAt).toBe("2026-10-17T09:00:00.000Z")
    repo.me = "ben"
    const home = await service.forHome("s", null)
    expect(home.ok && home.value.items.map((n) => [n.body, n.readAt])).toEqual([["Hi", null]])
  })

  it("refuses an empty note before it reaches the server", async () => {
    const { service, repo } = setup()
    const sent = await service.send("s", {
      recipientId: null,
      body: " ",
      pinned: false,
      expiry: "never",
    })
    expect(sent).toMatchObject({ ok: false, error: { field: "body" } })
    expect(repo.rows).toEqual([])
  })

  it("replies, lists the thread with names, and reads", async () => {
    const { service, repo } = setup()
    const sent = await service.send("s", {
      recipientId: null,
      body: "Movie?",
      pinned: false,
      expiry: "never",
    })
    if (!sent.ok) throw new Error("send failed")
    repo.me = "ben"
    expect(await service.reply("s", sent.value.id, "")).toMatchObject({ ok: false })
    expect(await service.reply("s", sent.value.id, "Yes")).toMatchObject({
      ok: true,
      value: { authorName: "Ben" },
    })
    const thread = await service.thread("s", sent.value.id)
    expect(thread.ok && thread.value.map((r) => `${r.authorName}: ${r.body}`)).toEqual(["Ben: Yes"])
    repo.me = "ana"
    const before = await service.forHome("s", null)
    expect(before.ok && before.value.items[0]?.replyCount).toBe(1)
    expect((await service.markRead(sent.value.id)).ok).toBe(true)
    expect(repo.reads.get(`${sent.value.id}:ana`)).toBeDefined()
  })

  it("offers every member but the writer as a recipient", async () => {
    const { service } = setup()
    const options = await service.recipients("s", "ana")
    expect(options.ok && options.value.map((m) => m.displayName)).toEqual(["Ben", "Cy"])
  })
})
