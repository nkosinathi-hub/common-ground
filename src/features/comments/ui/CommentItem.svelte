<script lang="ts">
  import { memberName } from "@/shared/domain"
  import { InitialAvatar, toast } from "@/shared/ui"
  import type { Comment, Viewer } from "../domain/comment"
  import CommentActions from "./CommentActions.svelte"
  import CommentEditForm from "./CommentEditForm.svelte"
  import CommentHeader from "./CommentHeader.svelte"
  import ReplyForm from "./ReplyForm.svelte"
  import SpoilerBody from "./SpoilerBody.svelte"
  import type { ThreadState } from "./thread-state.svelte"
  import Self from "./CommentItem.svelte"

  interface Props {
    comment: Comment
    thread: ThreadState
    viewer: Viewer
    /** Shows the episode badge; only a series' discussion tags comments. */
    tagged?: boolean
  }
  let { comment, thread, viewer, tagged = false }: Props = $props()

  const author = $derived(memberName(viewer.authors, comment.authorId))
  const mentioned = $derived(comment.mentionIds.map((id) => memberName(viewer.authors, id)))
  const replies = $derived(thread.replies.open.get(comment.id))
  let editing = $state(false)
  let replying = $state(false)

  async function remove() {
    const removed = await thread.remove(comment.id)
    if (!removed.ok) toast.error(removed.error.message)
  }
</script>

<!-- Comment / Episode (287:9543): who, which episode, when; the words; hearts, replies, Reply. -->
<article
  class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-item gap-y-related"
  aria-label={`Comment by ${author}`}
>
  <InitialAvatar
    name={author}
    size="sm"
    tone={comment.authorId === viewer.me ? "brand" : "secondary"}
    decorative
  />
  <CommentHeader
    {comment}
    {author}
    {viewer}
    {tagged}
    {editing}
    onEdit={() => (editing = true)}
    onDelete={remove}
  />
  <div class="col-start-2 flex flex-col gap-related">
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
      {#if mentioned.length > 0}<p class="type-xs text-muted-foreground">
          Mentioned {mentioned.join(", ")}
        </p>{/if}
      <CommentActions
        {comment}
        open={replies !== undefined}
        onHeart={() => void thread.heart(comment)}
        onReplies={comment.replyTo ? undefined : () => void thread.replies.toggle(comment.id)}
        onReply={() => (replying = true)}
      />
    {/if}
    {#if replying}
      <ReplyForm
        {author}
        onSend={(body) => thread.post({ body, spoiler: false, mentionIds: [] }, comment)}
        onDone={() => (replying = false)}
      />
    {/if}
    {#if replies && replies.length > 0}
      <ol
        class="flex flex-col gap-stack border-l border-border pl-item"
        aria-label="Replies to {author}"
      >
        {#each replies as reply (reply.id)}<li>
            <Self comment={reply} {thread} {viewer} />
          </li>{/each}
      </ol>
    {/if}
  </div>
</article>
