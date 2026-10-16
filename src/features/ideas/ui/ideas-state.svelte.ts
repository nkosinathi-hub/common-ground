import type { AppError, Cursor } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { IdeasService } from "../application/ideas-service"
import type { CaptureInput } from "../application/ports"
import { filterIdeas, type Idea, type IdeaFilter, type IdeaStage } from "../domain"

type View = "list" | "board"

/** Page state for the ideas list and board. Filters run client-side over loaded pages. */
export class IdeasState {
  readonly list: PagedList<Idea, Cursor>
  filter = $state<IdeaFilter>({})
  /** Only a change of "whose" reloads: it is applied on the server, the rest on loaded pages. */
  private readonly whose = $derived(this.filter.whose)
  view = $state<View>("list")
  /** A refused stage move; load errors live on the list. */
  moveError = $state<AppError | null>(null)
  visible = $derived.by(() => filterIdeas(this.list.items, this.filter, this.me()))

  constructor(
    private readonly ideas: IdeasService,
    private readonly spaceId: () => string,
    private readonly me: () => string,
  ) {
    this.list = new PagedList((after) => ideas.list(spaceId(), after, this.scope()))
  }

  private scope() {
    const whose = this.whose
    return whose ? { whose, me: this.me() } : undefined
  }

  load(): Promise<void> {
    this.moveError = null
    return this.list.load()
  }

  async capture(input: Omit<CaptureInput, "spaceId">): Promise<AppError | null> {
    return this.list.add(this.ideas.capture({ ...input, spaceId: this.spaceId() }))
  }

  async move(id: string, stage: IdeaStage): Promise<void> {
    this.moveError = await this.list.replace(this.ideas.moveStage(id, stage))
  }
}
