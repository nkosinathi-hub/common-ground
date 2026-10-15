import { describe, expect, it } from "vitest"
import { FakeCommentsGateway } from "../testing/fake-comments-gateway"
import { CommentsService } from "./comments-service"

const parent = { kind: "watch", id: "w1" } as const
const setup = (size = 2) => {
  const gateway = new FakeCommentsGateway()
  return { gateway, service: new CommentsService(gateway, size) }
}

describe("CommentsService", () => {
  it("pages newest first with a keyset cursor", async () => {
    const { gateway, service } = setup()
    gateway.seed("s", parent, 3)
    const first = await service.page("s", parent, null)
    if (!first.ok) throw new Error("expected a page")
    expect(first.value.items.map((c) => c.body)).toEqual(["Comment 3", "Comment 2"])
    expect(first.value.next).toEqual({ createdAt: first.value.items[1]?.createdAt, id: "c2" })
    const second = await service.page("s", parent, first.value.next)
    if (!second.ok) throw new Error("expected a page")
    expect(second.value.items.map((c) => c.body)).toEqual(["Comment 1"])
    expect(second.value.next).toBeNull()
  })

  it("validates and trims before posting, sending each mention once", async () => {
    const { gateway, service } = setup()
    const bad = await service.post({
      spaceId: "s",
      parent,
      body: " ",
      spoiler: false,
      mentionIds: [],
    })
    expect(bad.ok).toBe(false)
    expect(gateway.calls).toEqual([])
    const posted = await service.post({
      spaceId: "s",
      parent,
      body: "  Watch this ",
      spoiler: true,
      mentionIds: ["b", "b", "c"],
    })
    expect(posted).toMatchObject({
      ok: true,
      value: { body: "Watch this", mentionIds: ["b", "c"] },
    })
  })

  it("validates edits and passes deletes through", async () => {
    const { gateway, service } = setup()
    gateway.seed("s", parent, 1)
    expect((await service.edit("c1", "", false)).ok).toBe(false)
    expect(await service.edit("c1", " New ", true)).toMatchObject({
      ok: true,
      value: { body: "New", spoiler: true, edited: true },
    })
    expect((await service.remove("c1")).ok).toBe(true)
    expect(gateway.calls).toEqual(["edit:c1", "remove:c1"])
  })

  it("returns gateway failures unchanged", async () => {
    const { gateway, service } = setup()
    gateway.failWith = { kind: "denied", message: "No" }
    expect(await service.page("s", parent, null)).toMatchObject({ ok: false })
  })
})
