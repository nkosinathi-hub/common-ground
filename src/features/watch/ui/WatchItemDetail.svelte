<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import * as Tabs from "$lib/components/ui/tabs"
  import { ListingsNote } from "@/features/catalog"
  import { buildHash, type TitleTab } from "@/shared/domain"
  import { AsyncView, navigate, pageTitle } from "@/shared/ui"
  import type { DiscussionFrame } from "../domain/title-facts"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import TitleAside from "./TitleAside.svelte"
  import TitleHeader from "./TitleHeader.svelte"
  import { TitlePage } from "./title-page.svelte"

  interface Props {
    spaceId: string
    itemId: string
    backHref: string
    /** Phones only: Progress or Discussion; older links to other tabs open Progress. */
    tab?: TitleTab
    /** Wraps the page so its play button, trailer and player share one title's playback. */
    playback?: Snippet<[WatchItem, () => void, Snippet]>
    /** The play split button; true fills the phone's sticky bar. */
    play?: Snippet<[boolean]>
    /** Watch together: (the title, icon only). */
    together?: Snippet<[WatchItem, boolean]>
    /** Trailer and recommend icon buttons, for the title. */
    tools?: Snippet<[WatchItem]>
    player?: Snippet<[WatchItem]>
    discussion?: Snippet<[DiscussionFrame | null]>
  }

  let { spaceId, itemId, backHref, tab, ...slots }: Props = $props()
  const page = untrack(() => new TitlePage(useWatch(), spaceId, itemId))
  const wide = new MediaQuery("min-width: 768px")
  let checkedAt = $state<string | null>(null)
  const shown = $derived(tab === "discussion" ? "discussion" : "progress")
  const open = (next: string) =>
    navigate(buildHash({ name: "watch-item", spaceId, itemId, tab: next as TitleTab }))

  $effect(() => void untrack(() => page.load()))
  $effect(() => (page.view.value ? pageTitle.show(page.view.value.item.title) : undefined))
</script>

{#snippet body(item: WatchItem)}
  {#snippet actions()}{@render slots.play?.(false)}{@render slots.together?.(item, false)}{/snippet}
  {#snippet tools()}{@render slots.tools?.(item)}{/snippet}
  <TitleHeader
    view={page.view.value!}
    {backHref}
    seasons={page.seasonsText}
    wide={wide.current}
    {actions}
    {tools}
    onChanged={page.reloadItem}
  />
  {@render slots.player?.(item)}
  {#if wide.current}
    <div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
      <div class="min-w-0">{@render slots.discussion?.(page.frame)}</div>
      <aside class="flex min-w-0 flex-col gap-stack" aria-label="Progress and where to watch">
        <TitleAside {page} {item} wide onchecked={(at) => (checkedAt = at)} />
      </aside>
    </div>
    <ListingsNote {checkedAt} />
  {:else}
    <Tabs.Root value={shown} onValueChange={open} class="flex flex-col gap-stack">
      <Tabs.List variant="line" aria-label="Title" class="w-full justify-start">
        <Tabs.Trigger value="progress">Progress</Tabs.Trigger>
        <Tabs.Trigger value="discussion">Discussion</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="progress" class="flex flex-col gap-stack">
        <TitleAside {page} {item} wide={false} onchecked={(at) => (checkedAt = at)} />
      </Tabs.Content>
      <Tabs.Content value="discussion">{@render slots.discussion?.(page.frame)}</Tabs.Content>
    </Tabs.Root>
    <!-- One sticky action above the tab bar (M03c): play, and Watch together as an icon. -->
    <div
      class="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex gap-related border-t border-border bg-background/95 px-gutter py-related backdrop-blur"
    >
      {@render slots.play?.(true)}{@render slots.together?.(item, true)}
    </div>
  {/if}
{/snippet}

<!-- D03a/D03b (289:9576, 291:10377) on wide screens; M03c/M03d (292:10242, 296:10755) on phones. -->
<article class="flex flex-col gap-section">
  <AsyncView resource={page.view}>
    {#snippet children(current)}
      {#snippet content()}{@render body(current.item)}{/snippet}
      {#if slots.playback}{@render slots.playback(current.item, page.changed, content)}
      {:else}{@render content()}{/if}
    {/snippet}
  </AsyncView>
</article>
