<script lang="ts">
  import { FormError } from "@/shared/ui"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import { NOTE_MAX, type Note, type NoteReply } from "../domain"
  import type { NotesState } from "./notes-state.svelte"

  interface Props {
    note: Note
    notes: NotesState
    onReplied: (reply: NoteReply) => void
  }

  let { note, notes, onReplied }: Props = $props()
  const id = $derived(`note-reply-${note.id}`)
  let body = $state("")
  let error = $state<string | null>(null)
  let sending = $state(false)

  async function send(event: SubmitEvent) {
    event.preventDefault()
    sending = true
    const sent = await notes.reply(note, body)
    sending = false
    error = sent.ok ? null : sent.error.message
    if (!sent.ok) return
    onReplied(sent.value)
    body = ""
  }
</script>

<form class="flex flex-col gap-1" onsubmit={send}>
  <label class="sr-only" for={id}>Your reply</label>
  <Textarea {id} rows={2} maxlength={NOTE_MAX} placeholder="Write a reply" bind:value={body} />
  <FormError message={error} class="text-xs" />
  <Button type="submit" size="sm" class="self-start" disabled={sending || !body.trim()}
    >Send reply</Button
  >
</form>
