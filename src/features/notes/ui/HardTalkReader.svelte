<script lang="ts">
  import { untrack } from "svelte"
  import * as Dialog from "$lib/components/ui/dialog"
  import {
    authorStatus,
    filledSections,
    isUnread,
    SECTION_COPY,
    supportLine,
    TALK_TIP,
    wishLine,
    type Note,
  } from "../domain"
  import { useNotes } from "./context"
  import GentleResponses from "./GentleResponses.svelte"
  import HardTalkThread from "./HardTalkThread.svelte"
  import type { NotesState } from "./notes-state.svelte"
  import { SHEET } from "./sheet"

  interface Props {
    open: boolean
    note: Note
    notes: NotesState
    me: string
  }

  let { open = $bindable(), note, notes, me }: Props = $props()
  const { changes } = useNotes()
  const mine = $derived(note.authorId === me)
  const to = $derived(note.recipient.kind === "member" ? note.recipient.name : "")
  const lines = $derived(
    mine
      ? []
      : [
          wishLine(note.responseWish ?? "any", note.authorName),
          note.supportWish ? supportLine(note.supportWish, note.authorName) : null,
        ].filter((line) => line !== null),
  )
  let latest = $state(untrack(() => note.latestResponse?.kind ?? null))

  // Opening reads it: it leaves the top of Home and settles into the Notes card.
  $effect(() =>
    untrack(() => {
      if (isUnread(note)) void notes.markRead(note).then(() => changes.emit())
    }),
  )

  async function respond(...args: Parameters<NotesState["respond"]>) {
    const failure = await notes.respond(...args)
    if (!failure) changes.emit()
    return failure
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class={SHEET}>
    <Dialog.Header>
      <Dialog.Title>{mine ? `What you shared with ${to}` : `From ${note.authorName}`}</Dialog.Title>
      <Dialog.Description>
        {mine ? authorStatus(note) : "Take your time. There's no rush to respond."}
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4">
      {#each filledSections(note.sections) as [key, text] (key)}
        <section class="grid gap-1">
          <h3 class="text-sm font-medium text-muted-foreground">{SECTION_COPY[key].label}</h3>
          <p class="whitespace-pre-wrap">{text}</p>
        </section>
      {/each}
      {#each lines as line (line)}<p class="text-sm italic">{line}</p>{/each}
      {#if !mine}
        <GentleResponses
          respond={(kind, days) => respond(note, kind, days)}
          onResponded={(k) => (latest = k)}
        />
      {/if}
      {#if latest === "talk"}<p class="rounded-lg bg-secondary p-3 text-sm">{TALK_TIP}</p>{/if}
      <HardTalkThread {note} {notes} {mine} />
    </div>
  </Dialog.Content>
</Dialog.Root>
