<script lang="ts">
  import { Heart, MessageCircle, Reply } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import type { Comment } from "../domain/comment"

  interface Props {
    comment: Comment
    /** The replies under it are showing. */
    open: boolean
    onHeart: () => void
    /** Absent on a reply: replies are one level deep. */
    onReplies?: () => void
    onReply: () => void
  }

  let { comment, open, onHeart, onReplies, onReply }: Props = $props()
  const replies = $derived(
    comment.replies === 0
      ? "No replies"
      : `${comment.replies} ${comment.replies === 1 ? "reply" : "replies"}`,
  )
</script>

<!-- Comment / Episode (287:9543) actions: hearts, the replies under it, and Reply. -->
<div class="flex items-center gap-item text-muted-foreground">
  <Button
    variant="ghost"
    size="sm"
    class="h-7 px-hairline text-muted-foreground"
    aria-pressed={comment.hearted}
    aria-label="Heart, {comment.hearts}"
    onclick={onHeart}
  >
    <Heart class={cn(comment.hearted && "fill-current text-primary")} />{comment.hearts}
  </Button>
  {#if onReplies}
    <Button
      variant="ghost"
      size="sm"
      class="h-7 px-hairline text-muted-foreground"
      aria-expanded={open}
      disabled={comment.replies === 0}
      onclick={onReplies}
    >
      <MessageCircle aria-hidden="true" />{replies}
    </Button>
  {/if}
  <Button variant="ghost" size="sm" class="h-7 px-hairline text-muted-foreground" onclick={onReply}>
    <Reply aria-hidden="true" />Reply
  </Button>
</div>
