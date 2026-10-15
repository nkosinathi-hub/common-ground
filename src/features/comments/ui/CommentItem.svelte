<script lang="ts">
  import { Pencil, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { Result } from "@/shared/domain"
  import { ConfirmDialog, toast } from "@/shared/ui"
  import { canDelete, canEdit, type Comment } from "../domain/comment"
  import { nameOf, namesOf, type MemberRef } from "../domain/mentions"
  import CommentEditForm from "./CommentEditForm.svelte"
  import SpoilerBody from "./SpoilerBody.svelte"

  let {
    comment,
    members,
    me,
    isOwner,
    concealed,
    onReveal,
    onEdit,
    onDelete,
  }: {
    comment: Comment
    members: readonly MemberRef[]
    me: string
    isOwner: boolean
    concealed: boolean
    onReveal: () => void
    onEdit: (body: string, spoiler: boolean) => Promise<Result<unknown>>
    onDelete: () => Promise<Result<unknown>>
  } = $props()

  const author = $derived(nameOf(comment.authorId, members))
  const when = $derived(
    new Date(comment.createdAt).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  )
  let editing = $state(false)
  let confirming = $state(false)

  async function remove() {
    const removed = await onDelete()
    if (!removed.ok) toast.error(removed.error.message)
  }
</script>

<article class="grid gap-1 rounded-lg border p-3" aria-label={`Comment by ${author}`}>
  <header class="flex flex-wrap items-baseline gap-x-2 text-sm">
    <span class="font-medium">{author}{comment.authorId === me ? " (you)" : ""}</span>
    <time class="text-xs text-muted-foreground" datetime={comment.createdAt}>{when}</time>
    {#if comment.edited}<span class="text-xs text-muted-foreground">(edited)</span>{/if}
  </header>
  {#if editing}
    <CommentEditForm
      body={comment.body}
      spoiler={comment.spoiler}
      onSave={onEdit}
      onDone={() => (editing = false)}
    />
  {:else}
    <SpoilerBody body={comment.body} {concealed} {onReveal} />
    {#if comment.mentionIds.length > 0}
      <p class="text-xs text-muted-foreground">
        Mentioned {namesOf(comment.mentionIds, members).join(", ")}
      </p>
    {/if}
    <div class="flex gap-1">
      {#if canEdit(comment, me)}
        <Button size="sm" variant="ghost" onclick={() => (editing = true)}>
          <Pencil aria-hidden="true" />Edit
        </Button>
      {/if}
      {#if canDelete(comment, me, isOwner)}
        <Button
          size="sm"
          variant="ghost"
          class="text-destructive"
          onclick={() => (confirming = true)}
        >
          <Trash2 aria-hidden="true" />Delete
        </Button>
      {/if}
    </div>
  {/if}
</article>

<ConfirmDialog
  bind:open={confirming}
  title="Delete this comment?"
  description="It is removed for everyone in this space. This cannot be undone."
  confirmLabel="Delete"
  onConfirm={remove}
/>
