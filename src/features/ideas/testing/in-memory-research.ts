import type { ResearchRepository } from "../application/ports"
import type { Hypothesis, HypothesisStatus, IdeaNote, LinkInput, ResearchLink } from "../domain"
import { InMemoryChildren } from "./in-memory-children"

class InMemoryHypotheses extends InMemoryChildren<Hypothesis, string> {
  setStatus = (id: string, status: HypothesisStatus) => this.patch(id, { status })
}

/** Rows are written by `author` (null: someone who has since left). */
export function inMemoryResearch(author: string | null = null): ResearchRepository {
  const by = { createdBy: author }
  return {
    notes: new InMemoryChildren<IdeaNote, string>((base, body) => ({ ...base, ...by, body })),
    links: new InMemoryChildren<ResearchLink, LinkInput>((base, input) => ({
      ...base,
      ...by,
      ...input,
    })),
    hypotheses: new InMemoryHypotheses((base, statement) => ({
      ...base,
      ...by,
      statement,
      status: "untested",
    })),
  }
}
