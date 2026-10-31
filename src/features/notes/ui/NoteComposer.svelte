<script lang="ts">
  import { untrack } from "svelte"
  import { DialogShell, FormError, Resource, toast, ViewToggle } from "@/shared/ui"
  import { COMPOSER_COPY, MODES, type Draft, type NoteKind } from "../domain"
  import { sendHardTalk, sendQuick } from "./composer-actions"
  import { autosaveWhileOpen } from "./composer-effects.svelte"
  import { ComposerState } from "./composer-state.svelte"
  import { useNotes } from "./context"
  import HardTalkFields from "./HardTalkFields.svelte"
  import HardTalkFooter from "./HardTalkFooter.svelte"
  import type { NotesState } from "./notes-state.svelte"
  import QuickNoteFields from "./QuickNoteFields.svelte"
  import SaveStatus from "./SaveStatus.svelte"

  interface Props {
    open: boolean
    spaceId: string
    me: string
    notes: NotesState
    /** A draft to carry on with; it opens as "Something on my mind". */
    draft?: Draft | null
    /** Open straight on "Something on my mind", as the Home card of that name does. */
    hardTalk?: boolean
  }

  let { open = $bindable(), spaceId, me, notes, draft = null, hardTalk = false }: Props = $props()
  const { service, drafts, changes } = useNotes()
  const recipients = new Resource(() => service.recipients(spaceId, me))
  $effect(() => void recipients.load())
  const composer = new ComposerState(
    drafts,
    () => spaceId,
    untrack(() => draft),
  )
  const hard = $derived(composer.mode === "hard_talk")
  let step = $state(1)
  // Once the people load, so the partner is chosen when there are two of you.
  $effect(() => {
    if (hardTalk && recipients.value)
      untrack(() => composer.switchTo("hard_talk", recipients.value ?? []))
  })
  const name = $derived(recipients.value?.find((m) => m.id === composer.to)?.displayName ?? "")
  const switchTo = (mode: NoteKind) => ((step = 1), composer.switchTo(mode, recipients.value ?? []))
  // Closing saves what is left; the drafts list then shows it.
  autosaveWhileOpen(composer, () => changes.emit())

  async function send() {
    if (hard && step < 3) return void (step += 1)
    const sent = hard
      ? await sendHardTalk(composer, notes, drafts, spaceId)
      : await sendQuick(composer, notes)
    if (!sent) return void (hard && !composer.to && (step = 1))
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

<!-- Figma S01 and S01b (a quick note), S02a to S02c (something on my mind, in three steps). -->
<DialogShell
  bind:open
  wide={hard}
  title={COMPOSER_COPY[composer.mode].title}
  description={step === 1 ? COMPOSER_COPY[composer.mode].line : undefined}
  primary="Send note"
  busy={composer.sending}
  onsubmit={send}
  footer={hard ? hardFooter : undefined}
>
  {#snippet status()}{#if hard}<SaveStatus {composer} />{/if}{/snippet}
  {#snippet header()}
    {#if step === 1}
      <ViewToggle
        label="Kind of note"
        class="w-full! [&>*]:flex-1"
        value={composer.mode}
        options={MODES}
        onchange={switchTo}
      />
    {/if}
  {/snippet}
  {#if hard}
    <HardTalkFields {composer} members={recipients.value ?? []} {step} {name} />
  {:else}
    <QuickNoteFields {composer} members={recipients.value ?? []} spaceName="this space" />
  {/if}
  <FormError message={composer.error} />
</DialogShell>

{#snippet hardFooter()}
  <HardTalkFooter {composer} {name} {step} onstep={(n) => (step = n)} onDelete={deleteDraft} />
{/snippet}
