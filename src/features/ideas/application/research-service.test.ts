import { describe, expect, it } from "vitest"
import { inMemoryResearch } from "../testing/in-memory-research"
import { ResearchService } from "./research-service"

const link = { url: "https://x.dev", title: "X", description: "" }

describe("ResearchService", () => {
  it("adds, lists and removes notes, newest first", async () => {
    const research = new ResearchService(inMemoryResearch())
    await research.addNote("s", "i", "First")
    const second = await research.addNote("s", "i", " Second ")
    const page = await research.notes("i", null)
    expect(page.ok && page.value.items.map((note) => note.body)).toEqual(["Second", "First"])
    if (second.ok) await research.removeNote(second.value.id)
    const after = await research.notes("i", null)
    expect(after.ok && after.value.items).toHaveLength(1)
  })

  it("pages notes after a cursor", async () => {
    const research = new ResearchService(inMemoryResearch())
    await research.addNote("s", "i", "One")
    await research.addNote("s", "i", "Two")
    const page = await research.notes("i", { id: "row-2", createdAt: "" })
    expect(page.ok && page.value.items.map((note) => note.body)).toEqual(["One"])
  })

  it("refuses a non-web link or blank text before it reaches storage", async () => {
    const repo = inMemoryResearch()
    const research = new ResearchService(repo)
    const result = await research.addLink("s", "i", { ...link, url: "ftp://x.dev" })
    expect(result.ok ? null : result.error.field).toBe("url")
    const saved = await repo.links.list("i", null)
    expect(saved.ok && saved.value.items).toEqual([])
    expect((await research.addNote("s", "i", " ")).ok).toBe(false)
    expect((await research.addHypothesis("s", "i", "")).ok).toBe(false)
  })

  it("lists and removes links and hypotheses", async () => {
    const research = new ResearchService(inMemoryResearch())
    const added = await research.addLink("s", "i", link)
    const hypothesis = await research.addHypothesis("s", "i", "Works")
    if (!added.ok || !hypothesis.ok) throw new Error("add failed")
    expect((await research.links("i", null)).ok).toBe(true)
    expect((await research.hypotheses("i", null)).ok).toBe(true)
    expect((await research.removeLink(added.value.id)).ok).toBe(true)
    expect((await research.removeHypothesis(hypothesis.value.id)).ok).toBe(true)
    expect((await research.removeHypothesis(hypothesis.value.id)).ok).toBe(false)
  })

  it("tracks hypothesis status", async () => {
    const research = new ResearchService(inMemoryResearch())
    const added = await research.addHypothesis("s", "i", "People pay R40")
    if (!added.ok) throw new Error("add failed")
    expect(added.value.status).toBe("untested")
    const validated = await research.setHypothesisStatus(added.value.id, "validated")
    expect(validated.ok && validated.value.status).toBe("validated")
    expect((await research.setHypothesisStatus("missing", "invalidated")).ok).toBe(false)
  })
})
