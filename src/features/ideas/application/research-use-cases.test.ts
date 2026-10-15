import { describe, expect, it } from "vitest"
import { inMemoryResearch } from "../testing/in-memory-research"
import { makeResearchUseCases } from "./research-use-cases"

describe("research use cases", () => {
  it("adds, lists and removes notes, newest first", async () => {
    const research = makeResearchUseCases(inMemoryResearch())
    await research.addNote("s", "i", "First")
    const second = await research.addNote("s", "i", " Second ")
    const page = await research.notes("i", null)
    expect(page.ok && page.value.items.map((n) => n.body)).toEqual(["Second", "First"])
    if (second.ok) await research.removeNote(second.value.id)
    const after = await research.notes("i", null)
    expect(after.ok && after.value.items).toHaveLength(1)
  })

  it("refuses a non-web link before it reaches storage", async () => {
    const repo = inMemoryResearch()
    const research = makeResearchUseCases(repo)
    const result = await research.addLink("s", "i", {
      url: "ftp://x.dev",
      title: "F",
      description: "",
    })
    expect(result.ok ? null : result.error.field).toBe("url")
    const saved = await repo.links.list("i", null)
    expect(saved.ok && saved.value.items).toEqual([])
  })

  it("tracks hypothesis status", async () => {
    const research = makeResearchUseCases(inMemoryResearch())
    const added = await research.addHypothesis("s", "i", "People pay R40")
    if (!added.ok) throw new Error("add failed")
    expect(added.value.status).toBe("untested")
    const validated = await research.setHypothesisStatus(added.value.id, "validated")
    expect(validated.ok && validated.value.status).toBe("validated")
    expect((await research.setHypothesisStatus("missing", "invalidated")).ok).toBe(false)
  })
})
