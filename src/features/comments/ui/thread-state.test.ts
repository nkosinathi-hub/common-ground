import { describe, expect, it } from "vitest"
import { CommentsService } from "../application/comments-service"
import { FakeCommentsGateway } from "../testing/fake-comments-gateway"
import { ThreadState } from "./thread.svelte"

const parent = { kind: "idea", id: "i1" } as const
const setup = (count: number) => {
  const gateway = new FakeCommentsGateway(2)
  gateway.seed("s", parent, count)
  const thread = new ThreadState(new CommentsService(gateway), "s", parent)
  return { gateway, thread }
}
const bodies = (thread: ThreadState) => thread.items.map((c) => c.body)

describe("ThreadState", () => {
  it("shows the newest page oldest first and loads older comments above", async () => {
    const { thread } = setup(3)
    await thread.load()
    expect(thread.status).toBe("ready")
    expect(bodies(thread)).toEqual(["Comment 2", "Comment 3"])
    expect(thread.hasOlder).toBe(true)
    expect((await thread.loadOlder()).ok).toBe(true)
    expect(bodies(thread)).toEqual(["Comment 1", "Comment 2", "Comment 3"])
    expect(thread.hasOlder).toBe(false)
    expect((await thread.loadOlder()).ok).toBe(true)
  })

  it("reports load failures and keeps the list when loading older fails", async () => {
    const { gateway, thread } = setup(3)
    gateway.failWith = { kind: "network", message: "Offline" }
    await thread.load()
    expect(thread.status).toBe("error")
    expect(thread.error?.message).toBe("Offline")
    gateway.failWith = null
    await thread.load()
    gateway.failWith = { kind: "network", message: "Offline" }
    expect((await thread.loadOlder()).ok).toBe(false)
    expect(thread.items).toHaveLength(2)
    expect(thread.loadingOlder).toBe(false)
  })

  it("appends posts, edits in place keeping mentions, and removes", async () => {
    const { thread } = setup(0)
    await thread.load()
    await thread.post({ body: "New one", spoiler: false, mentionIds: ["b"] })
    expect(bodies(thread)).toEqual(["New one"])
    const id = thread.items[0]?.id ?? ""
    await thread.edit(id, "Changed", true)
    expect(thread.items[0]).toMatchObject({ body: "Changed", edited: true, mentionIds: ["b"] })
    await thread.remove(id)
    expect(thread.items).toEqual([])
  })

  it("leaves the list alone when a write fails", async () => {
    const { gateway, thread } = setup(1)
    await thread.load()
    gateway.failWith = { kind: "denied", message: "No" }
    expect((await thread.post({ body: "x", spoiler: false, mentionIds: [] })).ok).toBe(false)
    expect((await thread.edit("c1", "y", false)).ok).toBe(false)
    expect((await thread.remove("c1")).ok).toBe(false)
    expect(bodies(thread)).toEqual(["Comment 1"])
  })

  it("keeps spoilers concealed until revealed", async () => {
    const { thread } = setup(0)
    await thread.load()
    await thread.post({ body: "Twist", spoiler: true, mentionIds: [] })
    const comment = thread.items[0]
    if (!comment) throw new Error("expected a comment")
    expect(thread.concealed(comment)).toBe(true)
    thread.reveal(comment.id)
    expect(thread.concealed(comment)).toBe(false)
  })
})
