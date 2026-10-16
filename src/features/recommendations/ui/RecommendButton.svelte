<script lang="ts">
  import { Send } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { MemberRef } from "@/shared/domain"
  import { FormError, FormState, toast } from "@/shared/ui"
  import { NOTE_MAX, recipientOptions } from "../domain/recommendation"
  import { useRecommendations } from "./context"

  interface Props {
    spaceId: string
    itemId: string
    members: readonly MemberRef[]
    me: string
  }
  let { spaceId, itemId, members, me }: Props = $props()

  const { service } = useRecommendations()
  const form = new FormState()
  const options = $derived(recipientOptions(members, me))
  // Unique per title so several buttons on one page never share element ids.
  const noteId = $derived(`recommend-note-${spaceId}-${itemId}`)
  let open = $state(false)
  let chosen = $state<string[]>([])
  let note = $state("")

  const toggle = (id: string, on: boolean) =>
    (chosen = on ? [...chosen, id] : chosen.filter((c) => c !== id))

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const sent = await form.run(() => service.send({ itemId, recipientIds: chosen, note, me }))
    if (!sent.ok) return
    const names = options.filter((m) => chosen.includes(m.id)).map((m) => m.displayName)
    toast.success(`Recommended to ${names.join(", ")}`)
    open = false
    chosen = []
    note = ""
  }
</script>

<Button variant="outline" size="sm" onclick={() => (open = true)} disabled={options.length === 0}>
  <Send aria-hidden="true" />Recommend
</Button>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Recommend this title</Dialog.Title>
      <Dialog.Description
        >They get a notification and can acknowledge or dismiss it.</Dialog.Description
      >
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <fieldset class="grid gap-2">
        <legend class="mb-1 text-sm font-medium">Send to</legend>
        {#each options as member (member.id)}
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="accent-primary"
              checked={chosen.includes(member.id)}
              onchange={(e) => toggle(member.id, e.currentTarget.checked)}
            />
            {member.displayName}
          </label>
        {/each}
        <FormError message={form.fieldError("recipients")} />
      </fieldset>
      <div class="grid gap-1.5">
        <Label for={noteId}>Note (optional)</Label>
        <Textarea id={noteId} bind:value={note} maxlength={NOTE_MAX} />
        <FormError message={form.fieldError("note")} alert={false} />
      </div>
      <FormError message={form.formError} />
      <Dialog.Footer>
        <Button type="submit" disabled={form.pending}>Send</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
