<script lang="ts">
  import { useMembers } from "../composition/members"
  import { spacePeople } from "../composition/people.svelte"
  import { CommentThread } from "@/features/comments"
  import { WatchTogether } from "@/features/parties"
  import {
    PlayerSlot,
    PlaySplitButton,
    TitlePlaybackScope,
    TrailerButton,
  } from "@/features/playback"
  import { RecommendButton } from "@/features/recommendations"
  import type { Space } from "@/features/spaces"
  import { WatchItemDetail, WatchPage, type WatchItem } from "@/features/watch"
  import type { SummaryTitle } from "@/features/catalog"
  import { buildHash, type TitleTab } from "@/shared/domain"
  import { useCatalog } from "@/features/catalog/ui/context"
  import { playbackCatalog } from "../composition/playback-catalog"

  interface Props {
    space: Space
    /** The signed-in member's id. */
    me: string
    itemId: string | null
    tab?: TitleTab
  }

  let { space, me, itemId, tab }: Props = $props()
  const people = spacePeople(useMembers(), () => space.id)
  const catalog = playbackCatalog(useCatalog().service)
  const itemHref = (id: string) => buildHash({ name: "watch-item", spaceId: space.id, itemId: id })
  const summaryOf = (item: WatchItem): SummaryTitle => ({
    title: item.title,
    posterPath: item.posterPath,
    meta: item.releaseYear ? String(item.releaseYear) : undefined,
  })
</script>

{#if itemId}
  {#key itemId}
    <WatchItemDetail
      spaceId={space.id}
      {itemId}
      {tab}
      backHref={buildHash({ name: "watch", spaceId: space.id })}
    >
      {#snippet playback(item, onwatched, page)}
        {#if item.catalog}
          <TitlePlaybackScope
            target={{ spaceId: space.id, itemId: item.id, catalog: item.catalog }}
            {catalog}
            {onwatched}>{@render page()}</TitlePlaybackScope
          >
        {:else}{@render page()}{/if}
      {/snippet}
      {#snippet play(block)}<PlaySplitButton {block} />{/snippet}
      {#snippet together(item, compact)}
        <WatchTogether
          spaceId={space.id}
          {itemId}
          isFilm={item.mediaType === "movie"}
          {compact}
          title={summaryOf(item)}
        />
      {/snippet}
      {#snippet tools(item)}
        <TrailerButton />
        <RecommendButton
          spaceId={space.id}
          {itemId}
          members={people.members}
          {me}
          title={summaryOf(item)}
        />
      {/snippet}
      {#snippet player(item)}<PlayerSlot title={item.title} />{/snippet}
      {#snippet discussion(frame)}
        <CommentThread
          spaceId={space.id}
          parent={{ kind: "watch", id: itemId }}
          {me}
          isOwner={space.role === "owner"}
          members={people.members}
          authors={people.authors}
          episodes={frame}
        />
      {/snippet}
    </WatchItemDetail>
  {/key}
{:else}
  <WatchPage spaceId={space.id} {itemHref} defaultIntent={space.defaultWatchIntent} />
{/if}
