import { describe, expect, it } from "vitest"
import { EMPTY_DRAFT } from "../domain"
import { inMemoryNotesService } from "../testing/notes-fixture"

describe("DraftsService", () => {
  it("creates a draft on the first save and updates the same one after", async () => {
    const { drafts, draftsRepo } = inMemoryNotesService()
    const id = await drafts.save("s", null, EMPTY_DRAFT)
    expect(id).toEqual({ ok: true, value: "ana:draft-1" })
    const fields = { ...EMPTY_DRAFT, recipientId: "ben", sections: { feel: "sad" } }
    expect(await drafts.save("s", "ana:draft-1", fields)).toEqual(id)
    expect(draftsRepo.rows).toHaveLength(1)
    expect(await drafts.list("s")).toMatchObject({
      ok: true,
      value: [{ recipientName: "Ben", sections: { feel: "sad" } }],
    })
  })

  it("lists only my drafts, without a name when no one is chosen", async () => {
    const { drafts, repo } = inMemoryNotesService()
    await drafts.save("s", null, EMPTY_DRAFT)
    expect(await drafts.list("s")).toMatchObject({ value: [{ recipientName: null }] })
    repo.me = "ben"
    expect(await drafts.list("s")).toEqual({ ok: true, value: [] })
  })

  it("checks before sending, then sends the saved draft as a note", async () => {
    const { drafts, draftsRepo } = inMemoryNotesService()
    await drafts.save("s", null, EMPTY_DRAFT)
    expect(await drafts.send("s", "ana:draft-1", EMPTY_DRAFT)).toMatchObject({
      ok: false,
      error: { field: "to" },
    })
    const fields = { ...EMPTY_DRAFT, recipientId: "ben", sections: { feel: " sad " } }
    await drafts.save("s", "ana:draft-1", fields)
    const sent = await drafts.send("s", "ana:draft-1", fields)
    expect(sent).toMatchObject({
      ok: true,
      value: { kind: "hard_talk", sections: { feel: "sad" }, recipient: { name: "Ben" } },
    })
    expect(draftsRepo.rows).toEqual([])
    expect(await drafts.remove("missing")).toEqual({ ok: true, value: undefined })
  })

  it("passes on a failed save or list", async () => {
    const { drafts, draftsRepo } = inMemoryNotesService()
    draftsRepo.failSaves = true
    expect(await drafts.save("s", null, EMPTY_DRAFT)).toMatchObject({ ok: false })
    draftsRepo.list = async () => ({ ok: false, error: { kind: "network", message: "down" } })
    expect(await drafts.list("s")).toMatchObject({ ok: false })
    expect(
      await drafts.send("s", "x", { ...EMPTY_DRAFT, recipientId: "ben", sections: { feel: "x" } }),
    ).toMatchObject({ ok: false, error: { kind: "not_found" } })
  })
})
