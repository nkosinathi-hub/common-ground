<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Resource, toast } from "@/shared/ui"
  import { untrack } from "svelte"
  import { COMPOSER_INTRO, type Draft } from "../domain"
  import { sendHardTalk, sendQuick } from "./composer-actions"
  import { autosaveWhileOpen } from "./composer-effects.svelte"
  import { ComposerState } from "./composer.svelte"
  import { useNotes } from "./context"
  import HardTalkFields from "./HardTalkFields.svelte"
  import HardTalkFooter from "./HardTalkFooter.svelte"
  import ModeSwitch from "./ModeSwitch.svelte"
  import type { NotesState } from "./notes-state.svelte"
  import QuickNoteFields from "./QuickNoteFields.svelte"
  import RecipientField from "./RecipientField.svelte"
  import { SHEET } from "./sheet"

  interface Props {
    open: boolean
    spaceId: string
    me: string
    notes: NotesState
    /** A draft to carry on with; it opens as "Something on my mind". */
    draft?: Draft | null
  }

  let { open = $bindable(), spaceId, me, notes, draft = null }: Props = $props()
  const { service, drafts, changes } = useNotes()
  const recipients = new Resource(() => service.recipients(spaceId, me))
  $effect(() => void recipients.load())
  const composer = new ComposerState(
    drafts,
    () => spaceId,
    untrack(() => draft),
  )
  const SELECT = "h-11 rounded-lg border border-input bg-background px-2 text-sm"
  const hard = $derived(composer.mode === "hard_talk")
  const name = $derived(recipients.value?.find((m) => m.id === composer.to)?.displayName ?? "")

  // Closing saves what is left; the drafts list then shows it.
  autosaveWhileOpen(composer, () => changes.emit())

  async function send(event: SubmitEvent) {
    event.preventDefault()
    const sent = hard
      ? await sendHardTalk(composer, notes, drafts, spaceId)
      : await sendQuick(composer, notes)
    if (!sent) return
    if (hard) toast(`Sent. ${name} can open it when they're ready.`)
    changes.emit()
    open = false
  }

  async function deleteDraft() {
    await composer.dropDraft()
    changes.emit()
    open = false
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class={SHEET}>
    <Dialog.Header>
      <Dialog.Title>Write a note</Dialog.Title>
      <Dialog.Description>
        {hard ? COMPOSER_INTRO : "It shows on Home, and they get a notification."}
      </Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={send} novalidate>
      <ModeSwitch
        mode={composer.mode}
        onChange={(m) => composer.switchTo(m, recipients.value ?? [])}
      />
      <RecipientField
        bind:value={composer.to}
        members={recipients.value ?? []}
        direct={hard}
        select={SELECT}
      />
      {#if hard}
        <HardTalkFields {composer} />
      {:else}
        <QuickNoteFields {composer} select={SELECT} />
      {/if}
      {#if composer.error}<p class="text-sm text-destructive" role="alert">{composer.error}</p>{/if}
      {#if hard}
        <HardTalkFooter {composer} {name} onDelete={deleteDraft} />
      {:else}
        <Dialog.Footer
          ><Button type="submit" disabled={composer.sending}>Send</Button></Dialog.Footer
        >
      {/if}
    </form>
  </Dialog.Content>
</Dialog.Root>
