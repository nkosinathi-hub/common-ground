import { describe, expect, it } from "vitest"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import type { IdeasService } from "./ideas-service"

const setup = () => {
  const { repo, service } = inMemoryIdeasService()
  return { repo, ideas: service }
}

const captured = async (ideas: IdeasService) => {
  const created = await ideas.capture({ spaceId: "s", title: "Zine" })
  if (!created.ok) throw new Error("capture failed")
  return created.value
}

describe("IdeasService", () => {
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
    const idea = await captured(ideas)
    await ideas.moveStage(idea.id, "building")
    const tagged = await ideas.setTags(idea.id, [" Art ", "art"])
    expect(tagged.ok && tagged.value).toMatchObject({ stage: "building", tags: ["art"] })
  })

  it("renames with validation", async () => {
    const { ideas } = setup()
    const idea = await captured(ideas)
    expect((await ideas.rename(idea.id, "  ")).ok).toBe(false)
    const renamed = await ideas.rename(idea.id, " Big zine ")
    expect(renamed.ok && renamed.value.title).toBe("Big zine")
  })

  it("deletes an idea so it can no longer be read", async () => {
    const { ideas } = setup()
    const idea = await captured(ideas)
    expect((await ideas.get(idea.id)).ok).toBe(true)
    expect((await ideas.remove(idea.id)).ok).toBe(true)
    expect((await ideas.get(idea.id)).ok).toBe(false)
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
