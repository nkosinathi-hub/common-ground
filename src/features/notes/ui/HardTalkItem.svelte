<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Mail } from "@lucide/svelte"
  import { ConfirmDialog } from "@/shared/ui"
  import {
    authorStatus,
    hardTalkTitle,
    isUnread,
    responseLabel,
    TALK_TIP,
    type Note,
  } from "../domain"
  import { useNotes } from "./context"
  import HardTalkReader from "./HardTalkReader.svelte"
  import type { NotesState } from "./notes-state.svelte"

  interface Props {
    note: Note
    notes: NotesState
    me: string
  }

  let { note, notes, me }: Props = $props()
  const { changes } = useNotes()
  const mine = $derived(note.authorId === me)
  const unread = $derived(isUnread(note))
  const to = $derived(note.recipient.kind === "member" ? note.recipient.name : "")
  const latest = $derived(note.latestResponse)
  let reading = $state(false)
  let confirming = $state(false)

  async function takeBack() {
    if (!(await notes.takeBack(note))) changes.emit()
  }
</script>

<!-- An envelope: who and how it stands, never a word of what it says. -->
<li
  class="flex flex-col gap-related rounded-lg border p-item {unread
    ? 'border-primary/40 bg-secondary'
    : ''}"
  data-testid="home-note"
>
  <div class="flex flex-wrap items-center gap-related type-sm">
    <Mail class="size-4 text-muted-foreground" aria-hidden="true" />
    <span class="font-medium">{hardTalkTitle(note, me)}</span>
    {#if unread}<Badge>New</Badge><span class="sr-only">Unread</span>{/if}
  </div>
  <p class="type-sm text-muted-foreground">
    {#if mine}{authorStatus(note)}{:else if latest}You: {responseLabel(latest.kind)}{:else}Take your
      time.{/if}
  </p>
  {#if latest?.kind === "talk"}<p class="type-xs text-muted-foreground">{TALK_TIP}</p>{/if}
  <div class="flex flex-wrap gap-related">
    <Button size="sm" variant="outline" class="min-h-11" onclick={() => (reading = true)}
      >{mine ? "Read what you shared" : "Open"}</Button
    >
    {#if mine}
      <Button size="sm" variant="ghost" class="min-h-11" onclick={() => (confirming = true)}
        >Take it back</Button
      >
    {/if}
  </div>
</li>
{#if reading}<HardTalkReader bind:open={reading} {note} {notes} {me} />{/if}
<ConfirmDialog
  bind:open={confirming}
  title="Take this back?"
  description={`${to} won't see it any more. This can't be undone.`}
  confirmLabel="Take it back"
  onConfirm={takeBack}
/>
