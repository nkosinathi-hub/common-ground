<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { PenLine } from "@lucide/svelte"
  import { ErrorState, Loading, LoadMore, Resource } from "@/shared/ui"
  import type { Draft } from "../domain"
  import { useNotes } from "./context"
  import DraftsList from "./DraftsList.svelte"
  import NoteComposer from "./NoteComposer.svelte"
  import NoteItem from "./NoteItem.svelte"
  import { NotesState } from "./notes-state.svelte"

  interface Props {
    spaceId: string
  }

  let { spaceId }: Props = $props()
  const { service, drafts, hardTalk, arrivals, changes, me } = useNotes()
  const notes = new NotesState(service, () => spaceId, hardTalk)
  const list = notes.list
  const myDrafts = new Resource(() => drafts.list(spaceId))
  let writing = $state(false)
  let resuming = $state<Draft | null>(null)
  // Loads on mount and when the space changes; a new note or reply reloads the card.
  $effect(() => {
    void spaceId
    untrack(() => void notes.load())
  })
  $effect(() => {
    void spaceId
    untrack(() => void myDrafts.load())
  })
  $effect(() => arrivals.subscribe(() => void notes.load()))
  $effect(() => changes.subscribe(() => void (notes.load(), myDrafts.load())))

  function write(draft: Draft | null) {
    resuming = draft
    writing = true
  }
</script>

<div class="flex flex-col gap-3">
  <Button size="sm" variant="outline" class="self-end" onclick={() => write(null)}
    ><PenLine aria-hidden="true" />Write a note</Button
  >
  <DraftsList drafts={myDrafts.value ?? []} onOpen={write} />
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
  <NoteComposer bind:open={writing} {spaceId} me={me()} {notes} draft={resuming} />
{/if}
