<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { canDelete, formatAgo } from "@/shared/domain"
  import { canEdit, type Comment, type Viewer } from "../domain/comment"
  import CommentMenu from "./CommentMenu.svelte"

  interface Props {
    comment: Comment
    author: string
    viewer: Viewer
    tagged: boolean
    editing: boolean
    onEdit: () => void
    onDelete: () => Promise<void>
  }
  let { comment, author, viewer, tagged, editing, onEdit, onDelete }: Props = $props()
</script>

<header class="flex min-h-6 flex-wrap items-center gap-x-related">
  <span class="type-label text-foreground">{author}</span>
  {#if tagged && comment.tag}<Badge variant="secondary">E{comment.tag.episode}</Badge>{/if}
  <time class="type-xs text-muted-foreground" datetime={comment.createdAt}
    >{formatAgo(comment.createdAt)}</time
  >
  {#if comment.edited}<span class="type-xs text-muted-foreground">(edited)</span>{/if}
  <span class="ml-auto">
    <CommentMenu
      {author}
      canEdit={!editing && canEdit(comment, viewer.me)}
      canDelete={canDelete(comment.authorId, viewer)}
      {onEdit}
      {onDelete}
    />
  </span>
</header>
