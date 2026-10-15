import { describe, expect, it } from "vitest"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { makeIdeasUseCases } from "./ideas-use-cases"

const setup = () => {
  const repo = new InMemoryIdeas()
  return { repo, ideas: makeIdeasUseCases(repo) }
}

describe("ideas use cases", () => {
  it("captures with a title only, in the inbox", async () => {
    const { ideas } = setup()
    const result = await ideas.capture({ spaceId: "s", title: " Tea bar " })
    expect(result.ok && result.value).toMatchObject({
      title: "Tea bar",
      stage: "inbox",
      template: "blank",
    })
    expect((await ideas.capture({ spaceId: "s", title: "" })).ok).toBe(false)
  })

  it("prefills the brief from a template", async () => {
    const { ideas } = setup()
    const result = await ideas.capture({ spaceId: "s", title: "Shop", template: "business" })
    expect(result.ok && result.value.template).toBe("business")
  })

  it("moves stage and retags with normalized tags", async () => {
    const { ideas } = setup()
    const created = await ideas.capture({ spaceId: "s", title: "Zine" })
    if (!created.ok) throw new Error("capture failed")
    await ideas.moveStage(created.value.id, "building")
    const tagged = await ideas.setTags(created.value.id, [" Art ", "art"])
    expect(tagged.ok && tagged.value).toMatchObject({ stage: "building", tags: ["art"] })
  })

  it("saves the brief, then reports a conflict with the latest copy when stale", async () => {
    const { ideas } = setup()
    const created = await ideas.capture({ spaceId: "s", title: "Zine" })
    if (!created.ok) throw new Error("capture failed")
    const first = await ideas.saveBrief(created.value, { pitch: "Mine" })
    expect(first.ok && first.value.status).toBe("saved")
    const stale = await ideas.saveBrief(created.value, { pitch: "Old tab" })
    expect(stale.ok && stale.value).toMatchObject({
      status: "conflict",
      latest: { brief: { pitch: "Mine" } },
    })
  })

  it("pages through the list 50 at a time", async () => {
    const { ideas } = setup()
    for (let i = 0; i < 51; i++) await ideas.capture({ spaceId: "s", title: `Idea ${i}` })
    const first = await ideas.list("s", null)
    if (!first.ok) throw new Error("list failed")
    expect(first.value.items).toHaveLength(50)
    const second = await ideas.list("s", first.value.next)
    expect(second.ok && second.value.items.length).toBe(1)
  })
})
