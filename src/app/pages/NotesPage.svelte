<script lang="ts">
  import { PenLine } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { NotesCard } from "@/features/notes"

  let { spaceId }: { spaceId: string } = $props()
  let writing = $state(false)
</script>

<!-- Home's See all: every note in the space, newest first. -->
<div class="flex flex-col gap-section">
  <div class="flex items-center gap-item">
    <h1 class="min-w-0 flex-1 type-h1">Notes</h1>
    <Button variant="outline" onclick={() => (writing = true)}>
      <PenLine aria-hidden="true" />Write a note
    </Button>
  </div>
  <NotesCard {spaceId} bind:writing />
</div>
