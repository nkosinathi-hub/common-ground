<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Collapsible from "$lib/components/ui/collapsible"
  import { MessageSquare } from "@lucide/svelte"
  import type { Note } from "../domain"
  import NoteThread from "./NoteThread.svelte"
  import type { NotesState } from "./notes-state.svelte"

  let { note, notes, mine }: { note: Note; notes: NotesState; mine: boolean } = $props()
  let open = $state(false)
  const replies = $derived(note.replyCount > 0 ? `Replies (${note.replyCount})` : "Reply")
  const label = $derived(mine || note.replyCount > 0 ? replies : "Add a few words (optional)")
</script>

<Collapsible.Root bind:open>
  <Collapsible.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="sm" class="min-h-11 justify-self-start"
        ><MessageSquare aria-hidden="true" />{label}</Button
      >
    {/snippet}
  </Collapsible.Trigger>
  <Collapsible.Content>
    {#if open}<NoteThread {note} {notes} />{/if}
  </Collapsible.Content>
</Collapsible.Root>
