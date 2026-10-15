import type { ResearchRepository } from "../application/ports"
import type { Hypothesis, HypothesisStatus, IdeaNote, LinkInput, ResearchLink } from "../domain"
import { InMemoryChildren } from "./in-memory-children"

class InMemoryHypotheses extends InMemoryChildren<Hypothesis, string> {
  setStatus = (id: string, status: HypothesisStatus) => this.patch(id, { status })
}

export function inMemoryResearch(): ResearchRepository {
  return {
    notes: new InMemoryChildren<IdeaNote, string>((base, body) => ({
      ...base,
      body,
      createdBy: null,
    })),
    links: new InMemoryChildren<ResearchLink, LinkInput>((base, input) => ({ ...base, ...input })),
    hypotheses: new InMemoryHypotheses((base, statement) => ({
      ...base,
      statement,
      status: "untested",
    })),
  }
}
