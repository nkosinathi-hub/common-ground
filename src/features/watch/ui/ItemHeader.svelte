<script lang="ts">
  import type { Snippet } from "svelte"
  import { Poster } from "@/features/catalog"
  import { toast, type Resource } from "@/shared/ui"
  import { INTENTS } from "../domain/labels"
  import type { MemberProgress } from "../domain/progress-types"
  import type { SharedIntent, WatchItemView } from "../domain/types"
  import Choice from "./Choice.svelte"
  import { useWatch } from "./context"
  import ItemActions from "./ItemActions.svelte"
  import TitleRating from "./TitleRating.svelte"

  interface Props {
    view: WatchItemView
    backHref: string
    progress: Resource<MemberProgress>
    /** Watch together and recommend: the title's actions, primary first. */
    actions?: Snippet
    onChanged: () => void
    onRated: () => void
  }

  let { view, backHref, progress, actions, onChanged, onRated }: Props = $props()
  const { service } = useWatch()
  const item = $derived(view.item)

  async function changeIntent(intent: SharedIntent) {
    const result = await service.setIntent(item.id, intent)
    if (!result.ok) return toast.error(result.error.message)
    toast.success("List updated")
    onChanged()
  }
</script>

<!-- D03a title introduction: the artwork beside the year, the title, the story and what to do. -->
<header class="flex flex-col gap-columns sm:flex-row">
  <Poster
    path={item.posterPath}
    title={item.title}
    size="w342"
    class="aspect-2/3 h-auto w-32 shrink-0 self-start rounded-lg object-cover sm:w-45"
  />
  <div class="flex min-w-0 flex-1 flex-col gap-stack">
    <div class="flex items-start gap-item">
      <div class="flex min-w-0 flex-1 flex-col gap-related">
        {#if item.releaseYear}<p class="type-sm text-muted-foreground">{item.releaseYear}</p>{/if}
        <h1 class="type-h1 text-foreground">{item.title}</h1>
        <p class="type-body text-muted-foreground">
          {item.synopsis || "No synopsis yet. Add a little context to this story."}
        </p>
      </div>
      <ItemActions {view} {backHref} />
    </div>
    {#if actions}<div class="flex flex-wrap items-center gap-related">{@render actions()}</div>{/if}
    <div class="flex flex-wrap items-start gap-x-section gap-y-stack">
      <div class="w-full sm:w-60">
        <Choice
          id="item-intent"
          class="w-full"
          label="List"
          value={item.intent}
          options={INTENTS}
          onchange={(value) => value && changeIntent(value)}
        />
      </div>
      <TitleRating itemId={item.id} {progress} onSaved={onRated} />
    </div>
  </div>
</header>
