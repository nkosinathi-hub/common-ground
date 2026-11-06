<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import type { TitleTab } from "@/shared/domain"
  import { AsyncView, pageTitle, usePageActions } from "@/shared/ui"
  import type { DiscussionFrame } from "../domain/title-facts"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import TitleActivity from "./TitleActivity.svelte"
  import TitleHeader from "./TitleHeader.svelte"
  import { TitlePage } from "./title-page.svelte"

  interface Props {
    spaceId: string
    itemId: string
    backHref: string
    tab?: TitleTab
    playback?: Snippet<[WatchItem, () => void, Snippet]>
    play?: Snippet<[boolean]>
    together?: Snippet<[WatchItem, boolean]>
    tools?: Snippet<[WatchItem]>
    player?: Snippet<[WatchItem]>
    episodes?: Snippet
    discussion?: Snippet<[DiscussionFrame | null]>
  }
  let { spaceId, itemId, backHref, tab, ...slots }: Props = $props()
  const page = untrack(() => new TitlePage(useWatch(), spaceId, itemId))
  const shellActions = usePageActions()
  $effect(() => void untrack(() => page.load()))
  $effect(() => (page.view.value ? pageTitle.show(page.view.value.item.title) : undefined))
</script>

{#snippet body(item: WatchItem)}
  {#snippet tools()}{@render slots.tools?.(item)}{/snippet}
  <TitleHeader
    view={page.view.value!}
    {backHref}
    seasons={page.seasonsText}
    {tools}
    onChanged={page.reloadItem}
  />
  {@render slots.player?.(item)}
  {@render slots.episodes?.()}
  {#if !shellActions}<div class="flex flex-wrap gap-related">
      {@render slots.play?.(false)}
    </div>{/if}
  {@render slots.together?.(item, true)}
  <TitleActivity {page} {item} {tab} discussion={slots.discussion} />
{/snippet}

<article class="flex min-w-0 flex-col gap-stack sm:gap-section">
  <AsyncView resource={page.view}>
    {#snippet children(current)}
      {#snippet content()}{@render body(current.item)}{/snippet}
      {#if slots.playback}{@render slots.playback(current.item, page.changed, content)}
      {:else}{@render content()}{/if}
    {/snippet}
  </AsyncView>
</article>
