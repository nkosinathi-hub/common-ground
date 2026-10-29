<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { ArrowLeft } from "@lucide/svelte"
  import * as Tabs from "$lib/components/ui/tabs"
  import { buildHash, type TitleTab } from "@/shared/domain"
  import { AsyncView, navigate, pageTitle, Resource, TextLink } from "@/shared/ui"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import ItemHeader from "./ItemHeader.svelte"
  import TitleTabs from "./TitleTabs.svelte"

  interface Props {
    spaceId: string
    itemId: string
    backHref: string
    /** From the link; wide screens fold overview and episodes into progress. */
    tab?: TitleTab
    comments?: Snippet
    recommend?: Snippet
    together?: Snippet<[boolean]>
    play?: Snippet<[WatchItem, () => void]>
  }

  let { spaceId, itemId, backHref, tab, comments, recommend, together, play }: Props = $props()
  const { service, members, authors } = useWatch()
  const view = new Resource(() => service.get(spaceId, itemId))
  const people = new Resource(() => members.members(spaceId))
  const names = new Resource(() => authors.authors(spaceId))
  const wide = new MediaQuery("min-width: 768px")
  let progressVersion = $state(0)
  const changed = () => (progressVersion++, void view.load())
  const shown = $derived.by((): TitleTab => {
    if (!wide.current) return tab ?? "overview"
    return tab === "discussion" ? "discussion" : "progress"
  })
  const open = (next: string) =>
    navigate(buildHash({ name: "watch-item", spaceId, itemId, tab: next as TitleTab }))

  $effect(() => {
    void [spaceId, itemId]
    untrack(() => void (view.load(), people.load(), names.load()))
  })
  $effect(() => (view.value ? pageTitle.show(view.value.item.title) : undefined))
</script>

<!-- D03a and D03b on wide screens; M03 to M03d on phones, where each part is its own tab. -->
<article class="flex flex-col gap-section">
  <TextLink href={backHref} icon={ArrowLeft} class="w-fit flex-row-reverse">Watch library</TextLink>
  <AsyncView resource={view}>
    {#snippet children(current)}
      <ItemHeader view={current} {backHref} onChanged={() => view.load()}>
        {#snippet actions()}
          {#if together}{@render together(current.item.mediaType === "movie")}{/if}
          {@render recommend?.()}
        {/snippet}
      </ItemHeader>
      <Tabs.Root value={shown} onValueChange={open} class="flex flex-col gap-section">
        <Tabs.List variant="line" aria-label="Title" class="w-full justify-start overflow-x-auto">
          {#if !wide.current}<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="episodes">Episodes</Tabs.Trigger>{/if}
          <Tabs.Trigger value="progress">Progress</Tabs.Trigger>
          <Tabs.Trigger value="discussion">Discussion</Tabs.Trigger>
        </Tabs.List>
        <TitleTabs
          {spaceId}
          item={current.item}
          {people}
          {names}
          version={progressVersion}
          wide={wide.current}
          onchanged={changed}
        >
          {#snippet playing()}{@render play?.(current.item, changed)}{/snippet}
          {#snippet discussion()}{@render comments?.()}{/snippet}
        </TitleTabs>
      </Tabs.Root>
    {/snippet}
  </AsyncView>
</article>
