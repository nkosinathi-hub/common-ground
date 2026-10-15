<script lang="ts">
  import { Pencil } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { memberName } from "@/shared/domain"
  import { DeleteButton, toast } from "@/shared/ui"
  import { canDelete, canEdit, type Comment, type Viewer } from "../domain/comment"
  import CommentEditForm from "./CommentEditForm.svelte"
  import SpoilerBody from "./SpoilerBody.svelte"
  import type { ThreadState } from "./thread.svelte"

  interface Props {
    comment: Comment
    thread: ThreadState
    viewer: Viewer
  }
  let { comment, thread, viewer }: Props = $props()

  const author = $derived(memberName(viewer.members, comment.authorId))
  const mentioned = $derived(comment.mentionIds.map((id) => memberName(viewer.members, id)))
  const when = $derived(
    new Date(comment.createdAt).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  )
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
      {#if canDelete(comment, viewer.me, viewer.isOwner)}
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
