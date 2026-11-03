<script lang="ts">
  import { AsyncView, Resource } from "@/shared/ui"
  import type { Note } from "../domain"
  import { useNotes } from "./context"
  import NoteItem from "./NoteItem.svelte"
  import { NotesState } from "./notes-state.svelte"
  let { spaceId, noteId }: { spaceId: string; noteId: string } = $props()
  const { service, hardTalk, me } = useNotes()
  const notes = new NotesState(service, () => spaceId, hardTalk)
  const selected = new Resource<Note>(async () => {
    const found = await service.get(spaceId, noteId)
    if (found.ok) notes.list.items = [found.value]
    return found
  })
  $effect(() => {
    void [spaceId, noteId]
    void selected.load()
  })
</script>

<AsyncView resource={selected}>
  {#snippet children(note)}
    <ul aria-label="Selected note">
      <NoteItem note={notes.list.items[0] ?? note} {notes} me={me()} initiallyOpen />
    </ul>
  {/snippet}
</AsyncView>
