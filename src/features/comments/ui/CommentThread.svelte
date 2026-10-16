<script lang="ts">
  import { untrack } from "svelte"
  import { MessageSquare } from "@lucide/svelte"
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
  }
  let { spaceId, parent, me, isOwner, members, authors }: Props = $props()

  const { service } = useComments()
  const thread = $derived(new ThreadState(service, spaceId, parent))
  const viewer: Viewer = $derived({ me, isOwner, authors: authors ?? members })
  const list = $derived(thread.list)
  $effect(() => {
    void thread
    untrack(() => thread.load())
  })
</script>

<section class="grid gap-4" aria-label="Comments">
  {#if thread.items.length === 0 && list.error}
    <ErrorState error={list.error} onRetry={thread.load} />
  {:else if thread.items.length === 0 && list.loading}
    <Loading />
  {:else}
    <LoadMore {list} label="Load older comments" />
    {#if thread.items.length === 0}
      <EmptyState icon={MessageSquare} title="No comments yet" description="Say what you think." />
    {:else}
      <ol class="grid gap-3">
        {#each thread.items as comment (comment.id)}
          <li><CommentItem {comment} {thread} {viewer} /></li>
        {/each}
      </ol>
    {/if}
    <CommentComposer {members} {me} onSubmit={(draft) => thread.post(draft)} />
  {/if}
</section>
