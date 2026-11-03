<script lang="ts">
  import { PenLine } from "@lucide/svelte"
  import { navigate, PageAction } from "@/shared/ui"
  import { NoteDetail, NotesCard } from "@/features/notes"
  import { buildHash } from "@/shared/domain"

  let { spaceId, noteId }: { spaceId: string; noteId?: string } = $props()
  let writing = $state(false)
  const write = () => {
    writing = true
    if (noteId) navigate({ name: "notes", spaceId })
  }
</script>

<!-- Home's See all: every note in the space, newest first. -->
<div class="flex flex-col gap-section">
  <div class="flex items-center gap-item">
    <h1 class="min-w-0 flex-1 type-h1">Notes</h1>
    <PageAction icon={PenLine} label="Write a note" onclick={write} />
  </div>
  {#if noteId}
    <a href={buildHash({ name: "notes", spaceId })} class="type-sm text-primary">All notes</a>
    {#key noteId}<NoteDetail {spaceId} {noteId} />{/key}
  {:else}<NotesCard {spaceId} bind:writing />{/if}
</div>
