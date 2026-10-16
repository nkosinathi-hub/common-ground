<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { PenLine } from "@lucide/svelte"
  import { ErrorState, Loading, LoadMore } from "@/shared/ui"
  import { useNotes } from "./context"
  import NoteComposer from "./NoteComposer.svelte"
  import NoteItem from "./NoteItem.svelte"
  import { NotesState } from "./notes.svelte"

  interface Props {
    spaceId: string
  }

  let { spaceId }: Props = $props()
  const { service, arrivals, me } = useNotes()
  const notes = new NotesState(service, () => spaceId)
  const list = notes.list
  let writing = $state(false)
  // Loads on mount and when the space changes; a new note or reply reloads the card.
  $effect(() => {
    void notes.load()
  })
  $effect(() => arrivals.subscribe(() => void notes.load()))
</script>

<div class="flex flex-col gap-3">
  <Button size="sm" variant="outline" class="self-end" onclick={() => (writing = true)}
    ><PenLine aria-hidden="true" />Write a note</Button
  >
  {#if list.error && list.items.length === 0}
    <ErrorState error={list.error} onRetry={notes.load} />
  {:else if list.loading && list.items.length === 0}
    <Loading label="Loading notes" />
  {:else}
    <ul class="flex flex-col gap-2" aria-label="Notes">
      {#each notes.visible as note (note.id)}
        <NoteItem {note} {notes} me={me()} />
      {:else}
        <li class="text-sm text-muted-foreground">No notes yet.</li>
      {/each}
    </ul>
    <LoadMore {list} />
  {/if}
</div>
{#if writing}
  <NoteComposer bind:open={writing} {spaceId} me={me()} {notes} />
{/if}
