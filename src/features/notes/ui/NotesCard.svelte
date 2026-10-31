<script lang="ts">
  import { untrack } from "svelte"
  import { ErrorState, Loading, LoadMore, Resource } from "@/shared/ui"
  import type { Draft } from "../domain"
  import { useNotes } from "./context"
  import DraftsList from "./DraftsList.svelte"
  import NoteComposer from "./NoteComposer.svelte"
  import NoteItem from "./NoteItem.svelte"
  import { NotesState } from "./notes-state.svelte"

  interface Props {
    spaceId: string
    /** Opens the composer; the Write a note button lives in the card's header. */
    writing?: boolean
    /** Home shows the newest few beside each other; the notes page shows them all. */
    limit?: number
  }

  let { spaceId, writing = $bindable(false), limit }: Props = $props()
  const { service, drafts, hardTalk, arrivals, changes, me } = useNotes()
  const notes = new NotesState(service, () => spaceId, hardTalk)
  const list = notes.list
  const shown = $derived(limit ? notes.visible.slice(0, limit) : notes.visible)
  const myDrafts = new Resource(() => drafts.list(spaceId))
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
  $effect(() => {
    if (!writing) resuming = null
  })
  $effect(() => changes.subscribe(() => void (notes.load(), myDrafts.load())))

  function write(draft: Draft | null) {
    resuming = draft
    writing = true
  }
</script>

<div class="flex flex-col gap-stack">
  <DraftsList drafts={myDrafts.value ?? []} onOpen={write} />
  {#if list.error && list.items.length === 0}
    <ErrorState error={list.error} onRetry={notes.load} />
  {:else if list.loading && list.items.length === 0}
    <Loading label="Loading notes" />
  {:else}
    <ul class="grid items-start gap-stack md:grid-cols-2" aria-label="Notes">
      {#each shown as note (note.id)}
        <NoteItem {note} {notes} me={me()} />
      {:else}
        <li class="type-sm text-muted-foreground md:col-span-2">No notes yet.</li>
      {/each}
    </ul>
    {#if !limit}<LoadMore {list} />{/if}
  {/if}
</div>
{#if writing}
  <!-- Opened from the header starts a new note; a draft row sets what to resume. -->
  <NoteComposer bind:open={writing} {spaceId} me={me()} {notes} draft={resuming} />
{/if}
