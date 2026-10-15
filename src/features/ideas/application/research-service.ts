import { type Cursor, type Result } from "@/shared/domain"
import {
  validateHypothesis,
  validateNote,
  validateResearchLink,
  type HypothesisStatus,
  type LinkInput,
} from "../domain"
import type { ResearchRepository } from "./ports"

const guarded = async <V, T>(
  check: Result<V>,
  run: (value: V) => Promise<Result<T>>,
): Promise<Result<T>> => (check.ok ? run(check.value) : check)

/** Notes, research links and hypotheses on one idea, validated before they reach storage. */
export class ResearchService {
  constructor(private readonly repo: ResearchRepository) {}

  notes = (ideaId: string, after: Cursor | null) => this.repo.notes.list(ideaId, after)
  addNote = (spaceId: string, ideaId: string, body: string) =>
    guarded(validateNote(body), (value) => this.repo.notes.add(spaceId, ideaId, value))
  removeNote = (id: string) => this.repo.notes.remove(id)

  links = (ideaId: string, after: Cursor | null) => this.repo.links.list(ideaId, after)
  addLink = (spaceId: string, ideaId: string, input: LinkInput) =>
    guarded(validateResearchLink(input), (value) => this.repo.links.add(spaceId, ideaId, value))
  removeLink = (id: string) => this.repo.links.remove(id)

  hypotheses = (ideaId: string, after: Cursor | null) => this.repo.hypotheses.list(ideaId, after)
  addHypothesis = (spaceId: string, ideaId: string, statement: string) =>
    guarded(validateHypothesis(statement), (value) =>
      this.repo.hypotheses.add(spaceId, ideaId, value),
    )
  setHypothesisStatus = (id: string, status: HypothesisStatus) =>
    this.repo.hypotheses.setStatus(id, status)
  removeHypothesis = (id: string) => this.repo.hypotheses.remove(id)
}
