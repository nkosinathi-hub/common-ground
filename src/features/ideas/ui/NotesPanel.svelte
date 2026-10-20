<script lang="ts">
  import { untrack } from "svelte"
  import { canDelete, type Cursor, type Viewer } from "@/shared/domain"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import { DeleteButton, FormError, PagedList } from "@/shared/ui"
  import { NOTE_MAX, type Idea, type IdeaNote } from "../domain"
  import { useResearch } from "./context"
  import ListFooter from "./ListFooter.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
  }

  let { idea, viewer }: Props = $props()
  const research = useResearch().service
  const list = new PagedList<IdeaNote, Cursor>((after) => research.notes(idea.id, after))
  // Loads on mount and when the idea id changes; edits to the idea replace the prop, not the id.
  const ideaId = $derived(idea.id)
  $effect(() => {
    void ideaId
    untrack(() => void list.load())
  })

  let body = $state("")
  let error = $state<string | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    const failure = await list.add(research.addNote(idea.spaceId, idea.id, body))
    error = failure?.message ?? null
    if (!failure) body = ""
  }
  async function remove(id: string) {
    error = (await list.remove(id, research.removeNote(id)))?.message ?? null
  }
</script>

<section aria-labelledby="notes-heading" class="flex flex-col gap-3">
  <h2 id="notes-heading" class="text-lg font-semibold">Notes</h2>
  <form class="flex flex-col gap-2" onsubmit={add}>
    <label class="sr-only" for="note-body">New note</label>
    <Textarea
      id="note-body"
      bind:value={body}
      maxlength={NOTE_MAX}
      placeholder="Jot something down"
      rows={2}
    />
    <FormError message={error} />
    <Button type="submit" size="sm" class="self-start" disabled={!body.trim()}>Add note</Button>
  </form>
  <ul class="flex flex-col gap-2">
    {#each list.items as note (note.id)}
      <li class="flex items-start justify-between gap-2 rounded-lg border p-3" data-testid="note">
        <p class="text-sm whitespace-pre-wrap">{note.body}</p>
        {#if canDelete(note.createdBy, viewer)}
          <DeleteButton label="Delete note" what="this note" onConfirm={() => remove(note.id)} />
        {/if}
      </li>
    {/each}
  </ul>
  <ListFooter {list} empty="No notes yet." />
</section>
