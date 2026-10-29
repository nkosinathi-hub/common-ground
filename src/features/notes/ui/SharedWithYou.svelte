<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Mail } from "@lucide/svelte"
  import { Resource } from "@/shared/ui"
  import type { Note } from "../domain"
  import { useNotes } from "./context"
  import HardTalkReader from "./HardTalkReader.svelte"
  import { NotesState } from "./notes-state.svelte"

  interface Props {
    spaceId: string
  }

  let { spaceId }: Props = $props()
  const { service, hardTalk, arrivals, changes, me } = useNotes()
  const notes = new NotesState(service, () => spaceId, hardTalk)
  const waiting = new Resource(() => hardTalk.waiting(spaceId, me()))
  let opened = $state<Note | null>(null)
  let reading = $state(false)
  let region = $state<HTMLElement | null>(null)

  $effect(() => {
    void spaceId
    untrack(() => void waiting.load())
  })
  $effect(() => arrivals.subscribe(() => void waiting.load()))
  $effect(() => changes.subscribe(() => void waiting.load()))

  function open(note: Note) {
    opened = note
    reading = true
  }

  // The card is gone once read, so focus comes back to where it stood.
  $effect(() => {
    if (!reading && opened) queueMicrotask(() => region?.focus())
  })
</script>

<div bind:this={region} tabindex="-1" class="grid gap-3 outline-none empty:hidden">
  {#each waiting.value ?? [] as note (note.id)}
    <section
      class="flex flex-col gap-2 rounded-xl border border-primary/40 bg-secondary p-4 sm:flex-row sm:items-center"
      aria-labelledby="shared-{note.id}"
      data-testid="shared-with-you"
    >
      <Mail class="size-5 shrink-0 text-primary" aria-hidden="true" />
      <div class="flex-1">
        <h2 id="shared-{note.id}" class="font-medium">
          {note.authorName} shared something with you
        </h2>
        <p class="text-sm text-muted-foreground">Take your time.</p>
      </div>
      <Button class="min-h-11" onclick={() => open(note)}>Open when you're ready</Button>
    </section>
  {/each}
</div>
{#if opened && reading}<HardTalkReader bind:open={reading} note={opened} {notes} me={me()} />{/if}
