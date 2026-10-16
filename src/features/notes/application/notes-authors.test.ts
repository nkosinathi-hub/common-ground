import { describe, expect, it } from "vitest"
import { FakeMemberDirectory } from "@/shared/domain/testing/fake-members"
import { InMemoryNotes } from "../testing/in-memory-notes"
import { NotesService } from "./notes-service"

const ana = { id: "ana", displayName: "Ana" }
const ben = { id: "ben", displayName: "Ben" }
const clock = () => new Date("2026-10-16T09:00:00.000Z")

describe("NotesService authors", () => {
  it("names a removed author from their visible profile but never offers them as a recipient", async () => {
    const repo = new InMemoryNotes()
    const directory = new FakeMemberDirectory([ana, ben])
    const service = new NotesService(repo, directory, clock, directory)
    await service.send("s", { recipientId: null, body: "Hi", pinned: false, expiry: "day" })
    directory.list = [ben]
    directory.former = [ana]
    repo.me = "ben"
    const home = await service.forHome("s", null)
    expect(home.ok && home.value.items.map((n) => n.authorName)).toEqual(["Ana"])
    const recipients = await service.recipients("s", "ben")
    expect(recipients.ok && recipients.value.map((m) => m.id)).not.toContain("ana")
  })
})
