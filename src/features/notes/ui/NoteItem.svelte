<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Collapsible from "$lib/components/ui/collapsible"
  import { MessageSquare, Pin } from "@lucide/svelte"
  import { isUnread, whoToWhom, type Note } from "../domain"
  import NoteThread from "./NoteThread.svelte"
  import type { NotesState } from "./notes.svelte"

  interface Props {
    note: Note
    notes: NotesState
    me: string
  }

  let { note, notes, me }: Props = $props()
  let open = $state(false)
  const unread = $derived(isUnread(note))
  const toggle = $derived(note.replyCount > 0 ? `Replies (${note.replyCount})` : "Reply")

  function changed(next: boolean) {
    if (next && unread) void notes.markRead(note)
  }
</script>

<li
  class="flex flex-col gap-2 rounded-lg border p-3 {unread ? 'border-primary/40 bg-highlight' : ''}"
  data-testid="home-note"
>
  <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
    <span class="font-medium text-foreground">{whoToWhom(note, me)}</span>
    {#if note.pinned}<span class="inline-flex items-center gap-1"
        ><Pin class="size-3" aria-hidden="true" />Pinned</span
      >{/if}
    {#if unread}<Badge>New</Badge><span class="sr-only">Unread</span>{/if}
  </div>
  <p class="text-sm whitespace-pre-wrap">{note.body}</p>
  <Collapsible.Root bind:open onOpenChange={changed}>
    <Collapsible.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="xs" class="self-start"
          ><MessageSquare aria-hidden="true" />{toggle}</Button
        >
      {/snippet}
    </Collapsible.Trigger>
    <Collapsible.Content>
      <NoteThread {note} {notes} />
    </Collapsible.Content>
  </Collapsible.Root>
</li>
