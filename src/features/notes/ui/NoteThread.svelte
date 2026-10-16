<script lang="ts">
  import { untrack } from "svelte"
  import { AsyncView, Resource } from "@/shared/ui"
  import type { Note, NoteReply as Reply } from "../domain"
  import NoteReply from "./NoteReply.svelte"
  import type { NotesState } from "./notes-state.svelte"

  interface Props {
    note: Note
    notes: NotesState
  }

  let { note, notes }: Props = $props()
  const replies = new Resource<Reply[]>(() => notes.thread(untrack(() => note)))
  $effect(() => void replies.load())

  const added = (reply: Reply) => replies.set([...(replies.value ?? []), reply])
</script>

<div class="mt-2 flex flex-col gap-2 border-l-2 pl-3">
  <AsyncView resource={replies}>
    {#snippet children(list)}
      {#if list.length > 0}
        <ul class="flex flex-col gap-2" aria-label="Replies">
          {#each list as reply (reply.id)}
            <li class="text-sm">
              <span class="font-medium">{reply.authorName}</span>
              <p class="whitespace-pre-wrap">{reply.body}</p>
            </li>
          {/each}
        </ul>
      {/if}
    {/snippet}
  </AsyncView>
  <NoteReply {note} {notes} onReplied={added} />
</div>
