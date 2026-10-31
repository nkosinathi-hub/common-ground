<script lang="ts">
  import { Feather } from "@lucide/svelte"
  import { ListRow } from "@/shared/ui"
  import { useNotes } from "./context"
  import NoteComposer from "./NoteComposer.svelte"
  import { NotesState } from "./notes-state.svelte"

  let { spaceId }: { spaceId: string } = $props()
  const { service, hardTalk, me } = useNotes()
  const notes = new NotesState(service, () => spaceId, hardTalk)
  let writing = $state(false)
</script>

<!-- The "Something on your mind?" Home card (D01): one row that opens the composer on that kind. -->
<ListRow
  title="Something on your mind?"
  meta="Find the words at your own pace."
  icon={Feather}
  onclick={() => (writing = true)}
/>
{#if writing}
  <NoteComposer bind:open={writing} {spaceId} me={me()} {notes} hardTalk />
{/if}
