import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { makeIdeasUseCases } from "./ideas-use-cases"

const setup = async () => {
  const repo = new InMemoryIdeas()
  const ideas = makeIdeasUseCases(repo)
  const created = await ideas.capture({ spaceId: "s", title: "Zine" })
  if (!created.ok) throw new Error("capture failed")
  return { repo, ideas, idea: created.value }
}

describe("ideas use cases, edges", () => {
  it("renames with validation, gets and removes", async () => {
    const { ideas, idea } = await setup()
    expect((await ideas.rename(idea.id, "  ")).ok).toBe(false)
    const renamed = await ideas.rename(idea.id, " Big zine ")
    expect(renamed.ok && renamed.value.title).toBe("Big zine")
    expect((await ideas.get(idea.id)).ok).toBe(true)
    expect((await ideas.remove(idea.id)).ok).toBe(true)
    expect((await ideas.get(idea.id)).ok).toBe(false)
  })

  it("rejects an oversized brief before saving", async () => {
    const { ideas, idea } = await setup()
    const result = await ideas.saveBrief(idea, { problem: "x".repeat(4001) })
    expect(result.ok ? null : result.error.field).toBe("problem")
  })

  it("passes through non-conflict failures", async () => {
    const { repo, ideas, idea } = await setup()
    repo.updateBrief = async () => err(appError("denied", "No"))
    const result = await ideas.saveBrief(idea, { pitch: "x" })
    expect(result.ok ? null : result.error.kind).toBe("denied")
  })

  it("still reports a conflict when the latest copy cannot be read", async () => {
    const { repo, ideas, idea } = await setup()
    repo.updateBrief = async () => err(appError("conflict", "Changed"))
    repo.get = async () => err(appError("network", "Offline"))
    const result = await ideas.saveBrief(idea, { pitch: "x" })
    expect(result.ok ? null : result.error.kind).toBe("conflict")
  })
})
