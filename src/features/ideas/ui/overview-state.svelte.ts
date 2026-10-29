import type { AppError } from "@/shared/domain"
import { toast } from "@/shared/ui"
import type { IdeasService } from "../application/ideas-service"
import { changedFields, type Brief, type Idea } from "../domain"

/** The overview editor's copy of the brief; a save that lost a race opens the merge. */
export class OverviewState {
  base = $state<Idea>()!
  draft = $state<Brief>({})
  latest = $state<Idea | null>(null)
  busy = $state(false)
  fieldError = $state<AppError | null>(null)

  constructor(
    private readonly ideas: IdeasService,
    idea: Idea,
    private readonly onSaved: (idea: Idea) => void,
  ) {
    this.base = idea
    this.draft = { ...idea.brief }
  }

  get unsaved() {
    return changedFields(this.base.brief, this.draft).length > 0
  }
  discard = () => (this.draft = { ...this.base.brief })
  set = (field: string, value: string) => (this.draft = { ...this.draft, [field]: value })

  async save(brief: Brief = this.draft, from: Idea = this.base): Promise<void> {
    this.busy = true
    const result = await this.ideas.saveBrief(from, brief)
    this.busy = false
    if (!result.ok) return void (this.fieldError = result.error)
    this.fieldError = null
    if (result.value.status === "conflict") {
      const theirs = result.value.latest
      // Only title, stage or tags moved underneath us: nothing in the overview to merge.
      if (changedFields(from.brief, theirs.brief).length === 0) return this.save(brief, theirs)
      this.latest = theirs
      return
    }
    this.base = result.value.idea
    this.draft = { ...this.base.brief }
    this.latest = null
    this.onSaved(this.base)
    toast.success("Overview saved")
  }
}
