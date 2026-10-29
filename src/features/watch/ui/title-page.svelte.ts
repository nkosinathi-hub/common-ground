import { Resource } from "@/shared/ui"
import type { MemberProgress } from "../domain/progress-types"
import { discussionFrame, seasonsLabel, type SeasonFact } from "../domain/title-facts"
import type { WatchContext } from "./context"

/** Everything one title page loads, shared by its header, cards and discussion. */
export class TitlePage {
  readonly view
  readonly people
  readonly names
  readonly progress: Resource<MemberProgress>
  seasons = $state<readonly SeasonFact[]>([])
  /** Bumped when progress changes, so the watched-together log reloads too. */
  version = $state(0)

  constructor(
    private readonly context: WatchContext,
    private readonly spaceId: string,
    private readonly itemId: string,
  ) {
    this.view = new Resource(() => context.service.get(spaceId, itemId))
    this.people = new Resource(() => context.members.members(spaceId))
    this.names = new Resource(() => context.authors.authors(spaceId))
    this.progress = new Resource(() => context.service.progress(itemId))
  }

  get authors() {
    return this.names.value ?? this.people.value ?? []
  }
  get seasonsText() {
    return seasonsLabel(this.seasons)
  }
  get frame() {
    const state = this.progress.value
    const mine = state?.entries.find((e) => e.userId === state.me) ?? null
    return discussionFrame(mine, this.seasons)
  }

  async load(): Promise<void> {
    await Promise.all([
      this.view.load(),
      this.people.load(),
      this.names.load(),
      this.progress.load(),
    ])
    const catalog = this.view.value?.item.catalog
    if (catalog?.type !== "tv" || !this.context.seasons) return
    const seasons = await this.context.seasons(this.spaceId, catalog.id)
    if (seasons.ok) this.seasons = seasons.value
  }

  reloadItem = () => void this.view.load()
  changed = () => {
    this.version++
    void this.progress.load()
    void this.view.load()
  }
}
