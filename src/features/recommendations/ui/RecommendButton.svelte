<script lang="ts">
  import { BellRing, Send } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import { TitleSummary, type SummaryTitle } from "@/features/catalog"
  import type { MemberRef } from "@/shared/domain"
  import { DialogShell, FormError, FormField, FormState, toast } from "@/shared/ui"
  import { NOTE_MAX, recipientOptions } from "../domain/recommendation"
  import { useRecommendations } from "./context"
  import RecipientChips from "./RecipientChips.svelte"

  interface Props {
    spaceId: string
    itemId: string
    members: readonly MemberRef[]
    me: string
    title?: SummaryTitle
  }
  let { spaceId, itemId, members, me, title }: Props = $props()

  const { service } = useRecommendations()
  const form = new FormState()
  const options = $derived(recipientOptions(members, me))
  // Unique per title so several buttons on one page never share element ids.
  const noteId = $derived(`recommend-note-${spaceId}-${itemId}`)
  let open = $state(false)
  let chosen = $state<string[]>([])
  let note = $state("")
  const primary = $derived(chosen.length > 1 ? `Send to ${chosen.length} people` : "Send")

  /** Each time it opens, the dialog starts with nobody chosen and no note. */
  function start() {
    chosen = []
    note = ""
    form.error = null
    open = true
  }

  async function submit() {
    const sent = await form.run(() => service.send({ itemId, recipientIds: chosen, note, me }))
    if (!sent.ok) return
    const names = options.filter((m) => chosen.includes(m.id)).map((m) => m.displayName)
    toast.success(`Recommended to ${names.join(", ")}`)
    open = false
    chosen = []
    note = ""
  }
</script>

<Button
  variant="outline"
  size="icon"
  aria-label="Recommend"
  onclick={start}
  disabled={options.length === 0}
>
  <Send />
</Button>

<!-- Figma S09: the title, who to send it to as chips, a note, then send. -->
<DialogShell
  bind:open
  title="Recommend a title"
  description="Share a good find with someone in your space."
  {primary}
  busy={form.pending}
  onsubmit={submit}
>
  {#if title}<TitleSummary {title} />{/if}
  <RecipientChips
    {options}
    {chosen}
    error={form.fieldError("recipients")}
    ontoggle={(id) =>
      (chosen = chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id])}
  />
  <FormField id={noteId} label="Note" optional error={form.fieldError("note")}>
    {#snippet control({ id, describedby })}
      <Textarea
        {id}
        rows={3}
        maxlength={NOTE_MAX}
        placeholder="Why do you think they'd love it?"
        aria-describedby={describedby}
        bind:value={note}
      />
    {/snippet}
  </FormField>
  <Alert.Root role="note">
    <BellRing aria-hidden="true" />
    <Alert.Description>
      Each person gets a notification. It won't change their progress or add a watched-together
      entry.
    </Alert.Description>
  </Alert.Root>
  <FormError message={form.formError} />
</DialogShell>
