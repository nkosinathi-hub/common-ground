import { describe, expect, it } from "vitest"
import { inMemoryResearch } from "../testing/in-memory-research"
import { makeResearchUseCases } from "./research-use-cases"

describe("research use cases, edges", () => {
  it("lists and removes links and hypotheses", async () => {
    const research = makeResearchUseCases(inMemoryResearch())
    const link = await research.addLink("s", "i", {
      url: "https://x.dev",
      title: "X",
      description: "",
    })
    const hypothesis = await research.addHypothesis("s", "i", "Works")
    if (!link.ok || !hypothesis.ok) throw new Error("add failed")
    expect((await research.links("i", null)).ok).toBe(true)
    expect((await research.hypotheses("i", null)).ok).toBe(true)
    expect((await research.removeLink(link.value.id)).ok).toBe(true)
    expect((await research.removeHypothesis(hypothesis.value.id)).ok).toBe(true)
    expect((await research.removeHypothesis(hypothesis.value.id)).ok).toBe(false)
  })

  it("validates notes and hypotheses", async () => {
    const research = makeResearchUseCases(inMemoryResearch())
    expect((await research.addNote("s", "i", " ")).ok).toBe(false)
    expect((await research.addHypothesis("s", "i", "")).ok).toBe(false)
  })

  it("pages after a cursor", async () => {
    const research = makeResearchUseCases(inMemoryResearch())
    const first = await research.addNote("s", "i", "One")
    await research.addNote("s", "i", "Two")
    if (!first.ok) throw new Error("add failed")
    const page = await research.notes("i", { id: "row-2", createdAt: "" })
    expect(page.ok && page.value.items.map((n) => n.body)).toEqual(["One"])
  })
})
