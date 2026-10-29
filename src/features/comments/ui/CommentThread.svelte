<script lang="ts">
  import { untrack } from "svelte"
  import { MessageSquare } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import type { MemberRef } from "@/shared/domain"
  import { EmptyState, ErrorState, Loading, LoadMore } from "@/shared/ui"
  import type { ParentRef, Viewer } from "../domain/comment"
  import CommentComposer from "./CommentComposer.svelte"
  import CommentItem from "./CommentItem.svelte"
  import { useComments } from "./context"
  import { ThreadState } from "./thread-state.svelte"

  interface Props {
    spaceId: string
    parent: ParentRef
    me: string
    isOwner: boolean
    /** Current members, offered as mentions. */
    members: readonly MemberRef[]
    /** Names for authors and mentions; defaults to the current members. */
    authors?: readonly MemberRef[]
    /** The card's heading (D03b, D11). */
    title?: string
  }
  let { spaceId, parent, me, isOwner, members, authors, title = "Discussion" }: Props = $props()

  const { service } = useComments()
  const thread = $derived(new ThreadState(service, spaceId, parent))
  const viewer: Viewer = $derived({ me, isOwner, authors: authors ?? members })
  const list = $derived(thread.list)
  const shown = $derived(thread.items.length)
  const count = $derived(
    `${shown}${list.hasMore ? "+" : ""} ${shown === 1 && !list.hasMore ? "comment" : "comments"}`,
  )
  $effect(() => {
    void thread
    untrack(() => void thread.load())
  })
</script>

<!-- D03b and D11: one card holding the conversation and the box to add to it. -->
<Card.Root role="region" aria-label="Comments">
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if thread.items.length > 0}
      <Card.Action><Badge variant="outline">{count}</Badge></Card.Action>
    {/if}
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {#if thread.items.length === 0 && list.error}
      <ErrorState error={list.error} onRetry={thread.load} />
    {:else if thread.items.length === 0 && list.loading}
      <Loading />
    {:else}
      <LoadMore {list} label="Load older comments" />
      {#if thread.items.length === 0}
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Say what you think."
        />
      {:else}
        <ol class="flex flex-col gap-stack">
          {#each thread.items as comment (comment.id)}
            <li><CommentItem {comment} {thread} {viewer} /></li>
          {/each}
        </ol>
      {/if}
      <CommentComposer {members} {me} onSubmit={(draft) => thread.post(draft)} />
    {/if}
  </Card.Content>
</Card.Root>
