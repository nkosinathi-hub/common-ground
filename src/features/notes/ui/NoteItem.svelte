<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Collapsible from "$lib/components/ui/collapsible"
  import { Reply } from "@lucide/svelte"
  import { formatLongDay } from "@/shared/domain"
  import { InitialAvatar } from "@/shared/ui"
  import { isUnread, whoToWhom, type Note } from "../domain"
  import HardTalkItem from "./HardTalkItem.svelte"
  import NoteThread from "./NoteThread.svelte"
  import type { NotesState } from "./notes-state.svelte"

  interface Props {
    note: Note
    notes: NotesState
    me: string
  }

  let { note, notes, me }: Props = $props()
  let open = $state(false)
  const unread = $derived(isUnread(note))
  const author = $derived(note.authorId === me ? "You" : note.authorName)
  const to = $derived(
    note.recipient.kind === "everyone"
      ? "To everyone"
      : note.recipient.id === me
        ? "To you"
        : `To ${note.recipient.name}`,
  )
  const replies = $derived(note.replyCount === 1 ? "1 reply" : `${note.replyCount} replies`)
  const day = $derived(formatLongDay(new Date(note.createdAt)).split(" ").slice(1).join(" "))

  function changed(next: boolean) {
    if (next && unread) void notes.markRead(note)
  }
</script>

{#if note.kind === "hard_talk"}
  <HardTalkItem {note} {notes} {me} />
{:else}
  <!-- Figma Note card (211:4794): who, the words in the heading face, then the replies. -->
  <li
    class="flex flex-col gap-item rounded-lg border bg-card p-card {unread
      ? 'border-primary'
      : 'border-border'}"
    data-testid="home-note"
  >
    <div class="flex items-center gap-item">
      <InitialAvatar name={note.authorName} decorative />
      <span class="sr-only">{whoToWhom(note, me)}</span>
      <span class="flex min-w-0 flex-1 flex-col" aria-hidden="true">
        <span class="truncate type-label text-foreground">{author}</span>
        <span class="type-xs text-muted-foreground">{to}</span>
      </span>
      {#if note.pinned}<Badge variant="outline">Pinned</Badge>{/if}
      {#if unread}<Badge>New</Badge><span class="sr-only">Unread</span>{/if}
    </div>
    <p class="type-h3 whitespace-pre-wrap text-foreground">{note.body}</p>
    <Collapsible.Root bind:open onOpenChange={changed} class="flex flex-col gap-item">
      <div class="flex items-center gap-related">
        <span class="flex-1 type-xs text-muted-foreground"
          >{day}{note.replyCount ? ` · ${replies}` : ""}</span
        >
        <Collapsible.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="sm"><Reply aria-hidden="true" />Reply</Button>
          {/snippet}
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content>
        <!-- Content stays mounted while closed: load the thread on opening, and again on a reply. -->
        {#if open}{#key note.replyCount}<NoteThread {note} {notes} />{/key}{/if}
      </Collapsible.Content>
    </Collapsible.Root>
  </li>
{/if}
