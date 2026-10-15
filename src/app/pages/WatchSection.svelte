<script lang="ts">
  import { useAuth } from "@/features/auth"
  import { CommentThread } from "@/features/comments"
  import { RecommendButton } from "@/features/recommendations"
  import type { Space } from "@/features/spaces"
  import { useWatch, WatchItemDetail, WatchPage } from "@/features/watch"
  import { buildHash } from "@/shared/domain"
  import { Resource } from "@/shared/ui"

  let { space, itemId }: { space: Space; itemId: string | null } = $props()
  const { session } = useAuth()
  const { members } = useWatch()
  const people = new Resource(() => members.members(space.id))
  $effect(() => void people.load())
  const me = $derived(session.user?.id ?? "")
  const itemHref = (id: string) => buildHash({ name: "watch-item", spaceId: space.id, itemId: id })
</script>

{#if itemId}
  {#key itemId}
    <WatchItemDetail
      spaceId={space.id}
      {itemId}
      backHref={buildHash({ name: "watch", spaceId: space.id })}
    >
      {#snippet recommend()}
        <RecommendButton spaceId={space.id} {itemId} members={people.value ?? []} {me} />
      {/snippet}
      {#snippet comments()}
        <CommentThread
          spaceId={space.id}
          parent={{ kind: "watch", id: itemId }}
          {me}
          isOwner={space.role === "owner"}
          members={people.value ?? []}
        />
      {/snippet}
    </WatchItemDetail>
  {/key}
{:else}
  <WatchPage spaceId={space.id} {itemHref} />
{/if}
