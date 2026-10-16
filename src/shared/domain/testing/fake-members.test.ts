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
})
