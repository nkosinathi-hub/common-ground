<script lang="ts">
  import { untrack } from "svelte"
  import { MessageSquare } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { EmptyState, ErrorState, Loading, toast } from "@/shared/ui"
  import type { ParentRef } from "../domain/comment"
  import type { MemberRef } from "../domain/mentions"
  import CommentComposer from "./CommentComposer.svelte"
  import CommentItem from "./CommentItem.svelte"
  import { useComments } from "./context"
  import { ThreadState } from "./thread.svelte"

  let {
    spaceId,
    parent,
    me,
    isOwner,
    members,
  }: {
    spaceId: string
    parent: ParentRef
    me: string
    isOwner: boolean
    members: readonly MemberRef[]
  } = $props()

  const service = useComments()
  const thread = $derived(new ThreadState(service, spaceId, parent))
  $effect(() => {
    const current = thread
    untrack(() => void current.load())
  })

  async function older() {
    const loaded = await thread.loadOlder()
    if (!loaded.ok) toast.error(loaded.error.message)
  }
</script>

<section class="grid gap-4" aria-label="Comments">
  {#if thread.status === "loading"}
    <Loading />
  {:else if thread.status === "error" && thread.error}
    <ErrorState error={thread.error} onRetry={thread.retry} />
  {:else}
    {#if thread.hasOlder}
      <Button variant="ghost" size="sm" disabled={thread.loadingOlder} onclick={older}>
        Load older comments
      </Button>
    {/if}
    {#if thread.items.length === 0}
      <EmptyState icon={MessageSquare} title="No comments yet" description="Say what you think." />
    {:else}
      <ol class="grid gap-3">
        {#each thread.items as comment (comment.id)}
          <li>
            <CommentItem
              {comment}
              {members}
              {me}
              {isOwner}
              concealed={thread.concealed(comment)}
              onReveal={() => thread.reveal(comment.id)}
              onEdit={(body, spoiler) => thread.edit(comment.id, body, spoiler)}
              onDelete={() => thread.remove(comment.id)}
            />
          </li>
        {/each}
      </ol>
    {/if}
    <CommentComposer
      {members}
      {me}
      onSubmit={(draft) => thread.post(draft.body, draft.spoiler, draft.mentionIds)}
    />
  {/if}
</section>
