<script lang="ts">
  import { untrack } from "svelte"
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import { Label } from "$lib/components/ui/label"
  import {
    canDelete,
    formatDay,
    memberName,
    type Cursor,
    type MemberRef,
    type Viewer,
  } from "@/shared/domain"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import { DeleteButton, FormError, InitialAvatar, PagedList } from "@/shared/ui"
  import { NOTE_MAX, type Idea, type IdeaNote } from "../domain"
  import { useResearch } from "./context"
  import ListFooter from "./ListFooter.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
    /** Names for who wrote each note, including removed people still visible. */
    authors: readonly MemberRef[]
  }

  let { idea, viewer, authors }: Props = $props()
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

<!-- D07 Notes: who jotted what and when, then a box to add one. -->
<Card.Root role="region" aria-labelledby="notes-heading">
  <Card.Header>
    <Card.Title id="notes-heading">Notes</Card.Title>
    {#if list.items.length}<Card.Action
        ><Badge variant="outline">{list.items.length}</Badge></Card.Action
      >{/if}
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <ul class="flex flex-col gap-stack">
      {#each list.items as note (note.id)}
        <li class="flex items-start gap-item" data-testid="note">
          <InitialAvatar name={memberName(authors, note.createdBy)} size="sm" decorative />
          <div class="flex min-w-0 flex-1 flex-col gap-hairline">
            <p class="type-label whitespace-pre-wrap text-foreground">{note.body}</p>
            <p class="type-xs text-muted-foreground">
              {memberName(authors, note.createdBy)} · {formatDay(note.createdAt)}
            </p>
          </div>
          {#if canDelete(note.createdBy, viewer)}
            <DeleteButton label="Delete note" what="this note" onConfirm={() => remove(note.id)} />
          {/if}
        </li>
      {/each}
    </ul>
    <ListFooter {list} empty="No notes yet." />
    <form class="flex flex-col gap-related" onsubmit={add}>
      <Label for="note-body">Add a research note</Label>
      <Textarea
        id="note-body"
        bind:value={body}
        maxlength={NOTE_MAX}
        placeholder="Jot something down…"
        rows={3}
      />
      <FormError message={error} />
      <Button type="submit" class="self-start" disabled={!body.trim()}>Add note</Button>
    </form>
  </Card.Content>
</Card.Root>
