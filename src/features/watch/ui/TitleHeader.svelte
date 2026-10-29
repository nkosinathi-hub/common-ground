<script lang="ts">
  import type { Snippet } from "svelte"
  import { Poster } from "@/features/catalog"
  import { Separator } from "$lib/components/ui/separator"
  import type { WatchItemView } from "../domain/types"
  import ItemActions from "./ItemActions.svelte"
  import ListMenu from "./ListMenu.svelte"
  import OpinionToggle from "./OpinionToggle.svelte"

  interface Props {
    view: WatchItemView
    backHref: string
    /** "3 seasons", when the catalog knows. */
    seasons: string | null
    wide: boolean
    /** Play and Watch together: the header's actions on wide screens, the sticky bar on phones. */
    actions?: Snippet
    /** Trailer and recommend, as icon buttons. */
    tools?: Snippet
    onChanged: () => void
  }

  let { view, backHref, seasons, wide, actions, tools, onChanged }: Props = $props()
  const item = $derived(view.item)
  const meta = $derived([item.releaseYear, seasons].filter(Boolean).join(" · "))
</script>

{#snippet icons()}
  {@render tools?.()}<ItemActions {view} {backHref} {onChanged} />
{/snippet}
{#snippet synopsis()}
  {#if item.synopsis}<p class="line-clamp-2 type-body text-muted-foreground">
      {item.synopsis}
    </p>{/if}
{/snippet}

<!-- D03a header (289:9576), M03c on phones: poster, title, meta line, story and actions. -->
<header class="flex flex-col gap-stack">
  <div class="flex gap-columns">
    <Poster
      path={item.posterPath}
      title={item.title}
      size="w342"
      class="aspect-2/3 h-auto w-22 shrink-0 self-start rounded-lg object-cover md:w-30"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-related">
      <h1 class="type-h1 text-foreground">{item.title}</h1>
      <div class="flex flex-wrap items-center gap-x-item gap-y-hairline">
        {#if meta}<p class="type-sm text-muted-foreground">{meta}</p>{/if}
        <ListMenu {item} {onChanged} />
        {#if wide}
          <Separator orientation="vertical" class="h-5" />
          <OpinionToggle spaceId={item.spaceId} itemId={item.id} />
        {/if}
      </div>
      {#if wide}
        {@render synopsis()}
        <div class="flex flex-wrap items-center gap-related pt-related">
          {@render actions?.()}{@render icons()}
        </div>
      {:else}
        <div class="flex items-center gap-related">
          {@render icons()}<span class="ml-auto"
            ><OpinionToggle spaceId={item.spaceId} itemId={item.id} /></span
          >
        </div>
      {/if}
    </div>
  </div>
  {#if !wide}{@render synopsis()}{/if}
</header>
