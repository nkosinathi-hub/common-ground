import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { IdeasService } from "../application/ideas-service"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { IdeasState } from "./ideas-state.svelte"

const setup = () => {
  const repo = new InMemoryIdeas()
  return { repo, board: new IdeasState(new IdeasService(repo), () => "s") }
}

describe("IdeasState", () => {
  it("captures to the top, moves stage and filters", async () => {
    const { board } = setup()
    expect(await board.capture({ title: "Tea bar" })).toBeNull()
    expect(await board.capture({ title: "" })).toMatchObject({ kind: "validation" })
    const id = board.list.items[0]!.id
    await board.move(id, "building")
    expect(board.list.items[0]!.stage).toBe("building")
    board.filter = { stage: "inbox" }
    expect(board.visible).toEqual([])
  })

  it("loads pages and appends more", async () => {
    const { repo, board } = setup()
    for (let i = 0; i < 51; i++)
      await repo.create({ spaceId: "s", title: `I${i}`, template: "blank", brief: {} })
    await board.load()
    expect(board.list.items).toHaveLength(50)
    await board.list.loadMore()
    expect(board.list.items).toHaveLength(51)
    expect(board.list.hasMore).toBe(false)
  })

  it("keeps a refused move apart from load errors, and clears it on reload", async () => {
    const { repo, board } = setup()
    await board.move("missing", "paused")
    expect(board.moveError?.kind).toBe("not_found")
    await board.load()
    expect(board.moveError).toBeNull()
    repo.list = async () => err(appError("network", "down"))
    await board.load()
    expect(board.list.error?.kind).toBe("network")
  })
})
