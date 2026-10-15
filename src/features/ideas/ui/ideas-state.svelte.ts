import type { AppError } from "@/shared/domain"
import type { CaptureInput, IdeasUseCases } from "../application/ideas-use-cases"
import { filterIdeas, type Idea, type IdeaFilter, type IdeaStage } from "../domain"
import { type Cursor } from "@/shared/domain"

/** Page state for the ideas list and board. Filters run client-side over loaded pages. */
export class IdeasState {
  items = $state<Idea[]>([])
  next = $state<Cursor | null>(null)
  loading = $state(false)
  error = $state<AppError | null>(null)
  filter = $state<IdeaFilter>({})
  view = $state<"list" | "board">("list")
  visible = $derived(filterIdeas(this.items, this.filter))

  constructor(
    private readonly ideas: IdeasUseCases,
    private readonly spaceId: () => string,
  ) {}

  async load(more = false): Promise<void> {
    this.loading = true
    const result = await this.ideas.list(this.spaceId(), more ? this.next : null)
    this.loading = false
    if (!result.ok) {
      this.error = result.error
      return
    }
    this.error = null
    this.items = more ? [...this.items, ...result.value.items] : [...result.value.items]
    this.next = result.value.next
  }

  async capture(input: Omit<CaptureInput, "spaceId">): Promise<AppError | null> {
    const result = await this.ideas.capture({ ...input, spaceId: this.spaceId() })
    if (!result.ok) return result.error
    this.items = [result.value, ...this.items]
    return null
  }

  async move(id: string, stage: IdeaStage): Promise<void> {
    const result = await this.ideas.moveStage(id, stage)
    if (!result.ok) {
      this.error = result.error
      return
    }
    this.items = this.items.map((idea) => (idea.id === id ? result.value : idea))
  }
}
