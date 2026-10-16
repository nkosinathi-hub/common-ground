import { describe, expect, it } from "vitest"
import { inMemoryIdeasService } from "../testing/ideas-fixture"

describe("ideas in progress", () => {
  it("lists up to five exploring, planning or building ideas, most recently changed first", async () => {
    const { service } = inMemoryIdeasService()
    const ids: string[] = []
    for (const title of ["A", "B", "C", "D", "E", "F", "Parked", "Fresh"]) {
      const made = await service.capture({ spaceId: "s", title })
      if (made.ok) ids.push(made.value.id)
    }
    const stages = ["exploring", "planning", "building", "exploring", "planning", "building"]
    for (const [i, stage] of stages.entries()) await service.moveStage(ids[i]!, stage as never)
    await service.moveStage(ids[6]!, "paused")
    await service.capture({ spaceId: "other", title: "Elsewhere" })
    const listed = await service.inProgress("s")
    expect(listed.ok && listed.value.map((idea) => idea.title)).toEqual(["F", "E", "D", "C", "B"])
  })
})
