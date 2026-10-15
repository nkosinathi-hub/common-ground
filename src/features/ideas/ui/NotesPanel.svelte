<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { Idea, IdeaNote } from "../domain"
  import { DeleteButton } from "@/shared/ui"
  import { useResearch } from "./context"
  import ListFooter from "./ListFooter.svelte"
  import { PagedList } from "./paged-list.svelte"

  let { idea }: { idea: Idea } = $props()
  const research = useResearch()
  const list = new PagedList<IdeaNote>((after) => research.notes(idea.id, after))
  $effect(() => void list.load())

  let body = $state("")
  let error = $state<string | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    const failure = await list.add(research.addNote(idea.spaceId, idea.id, body))
    error = failure?.message ?? null
    if (!failure) body = ""
  }
</script>

<section aria-labelledby="notes-heading" class="flex flex-col gap-3">
  <h2 id="notes-heading" class="text-lg font-semibold">Notes</h2>
  <form class="flex flex-col gap-2" onsubmit={add}>
    <label class="sr-only" for="note-body">New note</label>
    <Textarea
      id="note-body"
      bind:value={body}
      maxlength={10000}
      placeholder="Jot something down"
      rows={2}
    />
    {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}
    <Button type="submit" size="sm" class="self-start" disabled={!body.trim()}>Add note</Button>
  </form>
  <ul class="flex flex-col gap-2">
    {#each list.items as note (note.id)}
      <li class="flex items-start justify-between gap-2 rounded-lg border p-3" data-testid="note">
        <p class="text-sm whitespace-pre-wrap">{note.body}</p>
        <DeleteButton
          label="Delete note"
          what="this note"
          onConfirm={async () =>
            (error = (await list.remove(note.id, research.removeNote(note.id)))?.message ?? null)}
        />
      </li>
    {/each}
  </ul>
  <ListFooter {list} empty="No notes yet." />
</section>
