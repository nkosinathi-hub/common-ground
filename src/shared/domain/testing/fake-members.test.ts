import { describe, expect, it } from "vitest"
import { FakeMemberDirectory } from "./fake-members"

describe("FakeMemberDirectory", () => {
  it("answers with a copy of its members", async () => {
    const directory = new FakeMemberDirectory([{ id: "a", displayName: "Ana" }])
    const first = await directory.members()
    if (!first.ok) throw new Error("expected members")
    first.value.push({ id: "b", displayName: "Ben" })
    expect(await directory.members()).toEqual({
      ok: true,
      value: [{ id: "a", displayName: "Ana" }],
    })
    expect(await new FakeMemberDirectory().members()).toEqual({ ok: true, value: [] })
  })

  it("names former people as authors but never offers them as members", async () => {
    const directory = new FakeMemberDirectory(
      [{ id: "a", displayName: "Ana" }],
      [{ id: "b", displayName: "Ben" }],
    )
    expect(await directory.members()).toEqual({
      ok: true,
      value: [{ id: "a", displayName: "Ana" }],
    })
    const authors = await directory.authors()
    expect(authors.ok && authors.value.map((p) => p.id)).toEqual(["a", "b"])
  })
})
