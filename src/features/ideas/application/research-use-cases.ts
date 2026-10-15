import type { Result } from "@/shared/domain"
import {
  validateHypothesis,
  validateNote,
  validateResearchLink,
  type HypothesisStatus,
  type LinkInput,
} from "../domain"
import { type Cursor } from "@/shared/domain"
import type { ResearchRepository } from "./ports"

const guarded = async <V, T>(
  check: Result<V>,
  run: (value: V) => Promise<Result<T>>,
): Promise<Result<T>> => (check.ok ? run(check.value) : check)

export function makeResearchUseCases(repo: ResearchRepository) {
  return {
    notes: (ideaId: string, after: Cursor | null) => repo.notes.list(ideaId, after),
    addNote: (spaceId: string, ideaId: string, body: string) =>
      guarded(validateNote(body), (value) => repo.notes.add(spaceId, ideaId, value)),
    removeNote: (id: string) => repo.notes.remove(id),

    links: (ideaId: string, after: Cursor | null) => repo.links.list(ideaId, after),
    addLink: (spaceId: string, ideaId: string, input: LinkInput) =>
      guarded(validateResearchLink(input), (value) => repo.links.add(spaceId, ideaId, value)),
    removeLink: (id: string) => repo.links.remove(id),

    hypotheses: (ideaId: string, after: Cursor | null) => repo.hypotheses.list(ideaId, after),
    addHypothesis: (spaceId: string, ideaId: string, statement: string) =>
      guarded(validateHypothesis(statement), (value) =>
        repo.hypotheses.add(spaceId, ideaId, value),
      ),
    setHypothesisStatus: (id: string, status: HypothesisStatus) =>
      repo.hypotheses.setStatus(id, status),
    removeHypothesis: (id: string) => repo.hypotheses.remove(id),
  }
}

export type ResearchUseCases = ReturnType<typeof makeResearchUseCases>
