<script lang="ts">
  import { Pencil } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { canDelete, formatDateTime, memberName } from "@/shared/domain"
  import { DeleteButton, toast } from "@/shared/ui"
  import { canEdit, type Comment, type Viewer } from "../domain/comment"
  import CommentEditForm from "./CommentEditForm.svelte"
  import SpoilerBody from "./SpoilerBody.svelte"
  import type { ThreadState } from "./thread-state.svelte"

  interface Props {
    comment: Comment
    thread: ThreadState
    viewer: Viewer
  }
  let { comment, thread, viewer }: Props = $props()

  const author = $derived(memberName(viewer.authors, comment.authorId))
  const mentioned = $derived(comment.mentionIds.map((id) => memberName(viewer.authors, id)))
  const when = $derived(formatDateTime(comment.createdAt))
  let editing = $state(false)

  async function remove() {
    const removed = await thread.remove(comment.id)
    if (!removed.ok) toast.error(removed.error.message)
  }
</script>

<article class="grid gap-1 rounded-lg border p-3" aria-label={`Comment by ${author}`}>
  <header class="flex flex-wrap items-baseline gap-x-2 text-sm">
    <span class="font-medium">{author}{comment.authorId === viewer.me ? " (you)" : ""}</span>
    <time class="text-xs text-muted-foreground" datetime={comment.createdAt}>{when}</time>
    {#if comment.edited}<span class="text-xs text-muted-foreground">(edited)</span>{/if}
  </header>
  {#if editing}
    <CommentEditForm
      body={comment.body}
      spoiler={comment.spoiler}
      onSave={(body, spoiler) => thread.edit(comment.id, body, spoiler)}
      onDone={() => (editing = false)}
    />
  {:else}
    <SpoilerBody
      body={comment.body}
      concealed={thread.concealed(comment)}
      onReveal={() => thread.reveal(comment.id)}
    />
    {#if mentioned.length > 0}
      <p class="text-xs text-muted-foreground">Mentioned {mentioned.join(", ")}</p>
    {/if}
    <div class="flex items-center gap-1">
      {#if canEdit(comment, viewer.me)}
        <Button size="sm" variant="ghost" onclick={() => (editing = true)}>
          <Pencil aria-hidden="true" />Edit
        </Button>
      {/if}
      {#if canDelete(comment.authorId, viewer)}
        <DeleteButton
          label="Delete comment"
          what="this comment"
          size="icon-sm"
          description="It is removed for everyone in this space. This cannot be undone."
          onConfirm={remove}
        />
      {/if}
    </div>
  {/if}
</article>
