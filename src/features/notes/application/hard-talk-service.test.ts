import { describe, expect, it } from "vitest"
import { EMPTY_DRAFT } from "../domain"
import { inMemoryNotesService } from "../testing/notes-fixture"

async function shared() {
  const fixture = inMemoryNotesService()
  const fields = { ...EMPTY_DRAFT, recipientId: "ben", sections: { feel: "sad" } }
  const id = await fixture.drafts.save("s", null, fields)
  if (id.ok) await fixture.drafts.send("s", id.value, fields)
  fixture.repo.me = "ben"
  return fixture
}

describe("HardTalkService", () => {
  it("waits at the top of Home for the recipient until they open it", async () => {
    const { hardTalk, service } = await shared()
    expect(await hardTalk.waiting("s", "ben")).toMatchObject({
      ok: true,
      value: [{ authorName: "Ana", kind: "hard_talk" }],
    })
    expect(await hardTalk.waiting("s", "cy")).toEqual({ ok: true, value: [] })
    await service.markRead("note-1")
    expect(await hardTalk.waiting("s", "ben")).toEqual({ ok: true, value: [] })
  })

  it("responds, which reads it and shows the author the response", async () => {
    const { hardTalk, hardTalkRepo, repo, service } = await shared()
    expect(await hardTalk.respond("note-1", "time", 3)).toMatchObject({ ok: true })
    expect(hardTalkRepo.reminders).toEqual([{ noteId: "note-1", days: 3 }])
    expect(await hardTalk.waiting("s", "ben")).toEqual({ ok: true, value: [] })
    repo.me = "ana"
    const page = await service.forHome("s", null)
    expect(page).toMatchObject({ value: { items: [{ latestResponse: { kind: "time" } }] } })
    expect(await hardTalk.respond("note-1", "here")).toMatchObject({ ok: false })
  })

  it("passes on a failed load", async () => {
    const { hardTalk, hardTalkRepo } = await shared()
    hardTalkRepo.toMe = async () => ({ ok: false, error: { kind: "network", message: "down" } })
    expect(await hardTalk.waiting("s", "ben")).toMatchObject({ ok: false })
  })
})
