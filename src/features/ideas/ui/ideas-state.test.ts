import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { makeIdeasUseCases } from "../application/ideas-use-cases"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { IdeasState } from "./ideas-state.svelte"

const setup = () => {
  const repo = new InMemoryIdeas()
  return { repo, board: new IdeasState(makeIdeasUseCases(repo), () => "s") }
}

describe("IdeasState", () => {
  it("captures to the top, moves stage and filters", async () => {
    const { board } = setup()
    expect(await board.capture({ title: "Tea bar" })).toBeNull()
    expect(await board.capture({ title: "" })).toMatchObject({ kind: "validation" })
    const id = board.items[0]!.id
    await board.move(id, "building")
    expect(board.items[0]!.stage).toBe("building")
    board.filter = { stage: "inbox" }
    expect(board.visible).toEqual([])
  })

  it("loads pages and appends more", async () => {
    const { repo, board } = setup()
    for (let i = 0; i < 51; i++)
      await repo.create({ spaceId: "s", title: `I${i}`, template: "blank", brief: {} })
    await board.load()
    expect(board.items).toHaveLength(50)
    await board.load(true)
    expect(board.items).toHaveLength(51)
    expect(board.next).toBeNull()
  })

  it("keeps the error from a failed load or move", async () => {
    const { repo, board } = setup()
    repo.list = async () => err(appError("network", "down"))
    await board.load()
    expect(board.error?.kind).toBe("network")
    await board.move("missing", "paused")
    expect(board.error?.kind).toBe("not_found")
  })
})
