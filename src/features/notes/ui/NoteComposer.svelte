<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { Resource } from "@/shared/ui"
  import { EXPIRY_CHOICES, NOTE_MAX, type Expiry } from "../domain"
  import { useNotes } from "./context"
  import type { NotesState } from "./notes.svelte"

  interface Props {
    open: boolean
    spaceId: string
    me: string
    notes: NotesState
  }

  let { open = $bindable(), spaceId, me, notes }: Props = $props()
  const { service } = useNotes()
  const recipients = new Resource(() => service.recipients(spaceId, me))
  $effect(() => void recipients.load())
  const SELECT = "h-9 rounded-lg border border-input bg-background px-2 text-sm"
  let to = $state("")
  let body = $state("")
  let pinned = $state(false)
  let expiry = $state<Expiry>("never")
  let error = $state<string | null>(null)
  let sending = $state(false)

  async function send(event: SubmitEvent) {
    event.preventDefault()
    sending = true
    const failure = await notes.send({ recipientId: to || null, body, pinned, expiry })
    sending = false
    error = failure?.message ?? null
    if (!failure) open = false
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Write a note</Dialog.Title>
      <Dialog.Description>It shows on Home, and they get a notification.</Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={send} novalidate>
      <div class="grid gap-1.5">
        <Label for="note-to">To</Label>
        <select id="note-to" class={SELECT} bind:value={to}>
          <option value="">Everyone</option>
          {#each recipients.value ?? [] as member (member.id)}
            <option value={member.id}>{member.displayName}</option>
          {/each}
        </select>
      </div>
      <div class="grid gap-1.5">
        <Label for="note-body">Note</Label>
        <Textarea id="note-body" rows={4} maxlength={NOTE_MAX} bind:value={body} />
        <p class="text-right text-xs text-muted-foreground">{body.length} / {NOTE_MAX}</p>
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" class="accent-primary" bind:checked={pinned} />Pin to the top
      </label>
      <div class="grid gap-1.5">
        <Label for="note-expiry">Expires</Label>
        <select id="note-expiry" class={SELECT} bind:value={expiry}>
          {#each EXPIRY_CHOICES as choice (choice.value)}
            <option value={choice.value}>{choice.label}</option>
          {/each}
        </select>
      </div>
      {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}
      <Dialog.Footer><Button type="submit" disabled={sending}>Send</Button></Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
