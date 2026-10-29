<script lang="ts">
  import { Pencil } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { canDelete, formatDay, memberName } from "@/shared/domain"
  import { DeleteButton, InitialAvatar, toast } from "@/shared/ui"
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
  const when = $derived(formatDay(comment.createdAt))
  let editing = $state(false)

  async function remove() {
    const removed = await thread.remove(comment.id)
    if (!removed.ok) toast.error(removed.error.message)
  }
</script>

<!-- D03b comment row: avatar, name and day, the owner's actions on the right, the words below. -->
<article
  class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-item gap-y-related"
  aria-label={`Comment by ${author}`}
>
  <InitialAvatar name={author} size="sm" decorative />
  <header class="flex min-h-8 flex-wrap items-center gap-x-related">
    <span class="type-label text-foreground"
      >{author}{comment.authorId === viewer.me ? " (you)" : ""}</span
    >
    <time class="type-xs text-muted-foreground" datetime={comment.createdAt}>{when}</time>
    {#if comment.edited}<span class="type-xs text-muted-foreground">(edited)</span>{/if}
    {#if !editing}
      <span class="ml-auto flex items-center gap-hairline">
        {#if canEdit(comment, viewer.me)}
          <Button size="sm" variant="ghost" onclick={() => (editing = true)}>
            <Pencil aria-hidden="true" />Edit
          </Button>
        {/if}
        {#if canDelete(comment.authorId, viewer)}
          <DeleteButton
            label="Delete comment"
            what="this comment"
            description="It is removed for everyone in this space. This cannot be undone."
            onConfirm={remove}
          />
        {/if}
      </span>
    {/if}
  </header>
  <div class="col-start-2 grid gap-related type-body">
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
        <p class="type-xs text-muted-foreground">Mentioned {mentioned.join(", ")}</p>
      {/if}
    {/if}
  </div>
</article>
