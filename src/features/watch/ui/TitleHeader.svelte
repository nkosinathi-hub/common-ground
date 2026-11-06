<script lang="ts">
  import type { Snippet } from "svelte"
  import { Info } from "@lucide/svelte"
  import { Poster } from "@/features/catalog"
  import { Button } from "$lib/components/ui/button"
  import { PageTool, usePageActions } from "@/shared/ui"
  import type { WatchItemView } from "../domain/types"
  import TitleDetails from "./TitleDetails.svelte"

  let {
    view,
    backHref,
    seasons,
    tools,
    onChanged,
  }: {
    view: WatchItemView
    backHref: string
    seasons: string | null
    tools?: Snippet
    onChanged: () => void
  } = $props()
  const actions = usePageActions()
  let about = $state(false)
  const item = $derived(view.item)
  const meta = $derived(
    [item.mediaType === "movie" ? "Film" : "Series", item.releaseYear, seasons]
      .filter(Boolean)
      .join(" · "),
  )
</script>

<header class="flex items-center gap-item sm:gap-columns">
  <Poster
    path={item.posterPath}
    title={item.title}
    size="w342"
    class={item.mediaType === "movie"
      ? "aspect-2/3 w-24 shrink-0 rounded-lg object-cover shadow-sm sm:w-40"
      : "aspect-2/3 w-16 shrink-0 rounded-lg object-cover shadow-sm sm:w-24"}
  />
  <div class="flex min-w-0 flex-1 flex-col items-start gap-related">
    <p class="type-label-sm text-muted-foreground">{meta}</p>
    <h1 class="type-h1 break-words text-foreground">{item.title}</h1>
    {#if item.mediaType === "movie" && item.synopsis}<p
        class="line-clamp-3 max-w-prose type-sm leading-relaxed text-muted-foreground"
      >
        {item.synopsis}
      </p>{/if}
    <Button
      variant="ghost"
      size="sm"
      class="-ml-3 text-muted-foreground"
      onclick={() => (about = true)}><Info aria-hidden="true" />About this title</Button
    >
  </div>
</header>
{#if actions}<PageTool
    label="About this title"
    icon={Info}
    order={40}
    onclick={() => (about = true)}
  />{/if}
<TitleDetails bind:open={about} {view} {backHref} {tools} {onChanged} />
