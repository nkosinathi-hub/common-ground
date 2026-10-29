import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import { IdeasState } from "./ideas-state.svelte"

const setup = () => {
  const { repo, service } = inMemoryIdeasService()
  return {
    repo,
    capture: (title: string) => service.capture({ spaceId: "s", title }),
    board: new IdeasState(
      service,
      () => "s",
      () => "ana",
    ),
  }
}

describe("IdeasState", () => {
  it("moves stage and filters", async () => {
    const { board, capture } = setup()
    await capture("Tea bar")
    await board.load()
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

  it("asks the server for the viewer's ideas when the whose filter is set", async () => {
    const { repo, board, capture } = setup()
    repo.author = "ben"
    await capture("Ben's")
    repo.author = "ana"
    await capture("Ana's")
    board.filter = { whose: "mine" }
    await board.load()
    expect(board.list.items.map((i) => i.title)).toEqual(["Ana's"])
    board.filter = { whose: "ours" }
    await board.load()
    expect(board.visible.map((i) => i.title)).toEqual(["Ana's"])
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
