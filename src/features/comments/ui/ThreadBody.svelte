<script lang="ts">
  import { MessageSquare } from "@lucide/svelte"
  import type { MemberRef } from "@/shared/domain"
  import { EmptyState, ErrorState, Loading, LoadMore } from "@/shared/ui"
  import type { Viewer } from "../domain/comment"
  import CommentComposer from "./CommentComposer.svelte"
  import CommentItem from "./CommentItem.svelte"
  import SpoilerNotice from "./SpoilerNotice.svelte"
  import type { ThreadState } from "./thread-state.svelte"

  interface Props {
    thread: ThreadState
    viewer: Viewer
    members: readonly MemberRef[]
    me: string
    /** "Ben is ahead…", when comments past your place are kept out. */
    notice: string | null
    /** A series: episode badges, and the prompt composer above instead of the box below. */
    tagged: boolean
  }
  let { thread, viewer, members, me, notice, tagged }: Props = $props()
  const list = $derived(thread.list)
</script>

{#if thread.items.length === 0 && list.error}
  <ErrorState error={list.error} onRetry={thread.load} />
{:else if thread.items.length === 0 && list.loading}
  <Loading />
{:else}
  <LoadMore {list} label="Load older comments" />
  {#if thread.items.length === 0 && !notice}
    <EmptyState icon={MessageSquare} title="No comments yet" description="Say what you think." />
  {:else}
    <ol class="flex flex-col gap-section">
      {#each thread.items as comment (comment.id)}
        <li><CommentItem {comment} {thread} {viewer} {tagged} /></li>
      {/each}
    </ol>
  {/if}
  {#if notice}<SpoilerNotice text={notice} onShow={thread.show} />{/if}
  {#if !tagged}<CommentComposer {members} {me} onSubmit={(draft) => thread.post(draft)} />{/if}
{/if}
