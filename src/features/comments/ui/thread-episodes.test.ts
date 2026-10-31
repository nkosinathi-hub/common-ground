import { describe, expect, it } from "vitest"
import { CommentsService } from "../application/comments-service"
import { FakeCommentsGateway } from "../testing/fake-comments-gateway"
import { ThreadState } from "./thread-state.svelte"

const parent = { kind: "watch", id: "w1" } as const
const at = (episode: number) => ({ tag: { season: 1, episode } })

function setup(place: { season: number; episode: number } | null) {
  const gateway = new FakeCommentsGateway()
  gateway.seed("s", parent, 1, "ana", at(2))
  gateway.seed("s", parent, 1, "cy", at(3))
  gateway.seed("s", parent, 2, "ben", at(5))
  const context = () => ({ place, episodeCount: 6 })
  const thread = new ThreadState(new CommentsService(gateway), "s", parent, context)
  return { gateway, thread }
}
const bodies = (thread: ThreadState) => thread.items.map((c) => c.body)

describe("a series discussion", () => {
  it("opens on your episode and keeps what is past your place out, counted", async () => {
    const { thread } = setup({ season: 1, episode: 3 })
    await thread.load()
    expect(thread.chip).toBe(3)
    expect(bodies(thread)).toEqual(["Comment 2"])
    expect(thread.hidden.map((h) => h.tag?.episode)).toEqual([5, 5])
    thread.choose(null)
    await thread.load()
    expect(bodies(thread)).toEqual(["Comment 1", "Comment 2"])
  })

  it("shows what is ahead when asked, and before you start hides every tagged comment", async () => {
    const { thread } = setup({ season: 1, episode: 3 })
    thread.chip = null
    thread.show()
    await thread.load()
    expect(bodies(thread)).toHaveLength(4)
    expect(thread.hidden).toEqual([])
    const before = setup(null).thread
    await before.load()
    expect(before.chip).toBeNull()
    expect(bodies(before)).toEqual([])
    expect(before.hidden).toHaveLength(4)
  })

  it("tags a new comment with the chosen episode, threads replies and counts hearts", async () => {
    const { gateway, thread } = setup({ season: 1, episode: 3 })
    await thread.load()
    const posted = await thread.post({ body: "Loved it", spoiler: false, mentionIds: [] })
    expect(posted.ok && posted.value.tag).toEqual({ season: 1, episode: 3 })
    const root = thread.items[0]!
    await thread.post({ body: "Same", spoiler: false, mentionIds: [] }, root)
    expect(thread.replies.open.get(root.id)?.map((c) => c.body)).toEqual(["Same"])
    await thread.heart(root)
    expect(thread.items[0]).toMatchObject({ hearts: 1, hearted: true })
    expect(gateway.hearts.get(root.id)?.has("me")).toBe(true)
    await thread.heart(thread.items[0]!)
    expect(thread.items[0]).toMatchObject({ hearts: 0, hearted: false })
  })
})
