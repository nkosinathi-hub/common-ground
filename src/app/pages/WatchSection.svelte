<script lang="ts">
  import { useMembers } from "../composition/members"
  import { spacePeople } from "../composition/people.svelte"
  import { CommentThread } from "@/features/comments"
  import { WatchTogether } from "@/features/parties"
  import { PlayButton } from "@/features/playback"
  import { RecommendButton } from "@/features/recommendations"
  import type { Space } from "@/features/spaces"
  import { WatchItemDetail, WatchPage } from "@/features/watch"
  import { buildHash } from "@/shared/domain"

  interface Props {
    space: Space
    /** The signed-in member's id. */
    me: string
    itemId: string | null
  }

  let { space, me, itemId }: Props = $props()
  const people = spacePeople(useMembers(), () => space.id)
  const itemHref = (id: string) => buildHash({ name: "watch-item", spaceId: space.id, itemId: id })
</script>

{#if itemId}
  {#key itemId}
    <WatchItemDetail
      spaceId={space.id}
      {itemId}
      backHref={buildHash({ name: "watch", spaceId: space.id })}
    >
      {#snippet together(isFilm: boolean)}
        <WatchTogether spaceId={space.id} {itemId} {isFilm} />
      {/snippet}
      {#snippet play(item)}
        {#if item.catalog}
          <PlayButton
            target={{ spaceId: space.id, itemId: item.id, catalog: item.catalog }}
            title={item.title}
          />
        {/if}
      {/snippet}
      {#snippet recommend()}
        <RecommendButton spaceId={space.id} {itemId} members={people.members} {me} />
      {/snippet}
      {#snippet comments()}
        <CommentThread
          spaceId={space.id}
          parent={{ kind: "watch", id: itemId }}
          {me}
          isOwner={space.role === "owner"}
          members={people.members}
          authors={people.authors}
        />
      {/snippet}
    </WatchItemDetail>
  {/key}
{:else}
  <WatchPage spaceId={space.id} {itemHref} defaultIntent={space.defaultWatchIntent} />
{/if}
