<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { todayDateOnly } from "@/shared/domain"
  import { FormState, toast } from "@/shared/ui"
  import type { SpaceMember } from "../domain/types"
  import { useWatch } from "./context"
  import { SessionFormState } from "./session-form.svelte"

  interface Props {
    open: boolean
    itemId: string
    members: readonly SpaceMember[]
    onLogged: () => void
  }

  let { open = $bindable(false), itemId, members, onLogged }: Props = $props()
  const { service } = useWatch()
  const fields = new SessionFormState(() => todayDateOnly())
  const submission = new FormState()

  $effect(() => {
    if (open) fields.reset(members.map((m) => m.id))
  })

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const logged = await submission.run(() => service.logSession(itemId, fields.toInput()))
    if (!logged.ok) return
    toast.success("Logged. Everyone there is marked completed.")
    open = false
    onLogged()
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Log watched together</Dialog.Title>
      <Dialog.Description>
        Everyone you tick is marked completed on that day. Nobody else's progress changes.
      </Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <div class="grid gap-1.5">
        <Label for="session-day">Watched on</Label>
        <Input id="session-day" type="date" max={todayDateOnly()} bind:value={fields.watchedOn} />
        {#if submission.fieldError("watchedOn")}
          <p class="text-sm text-destructive">{submission.fieldError("watchedOn")}</p>
        {/if}
      </div>
      <fieldset class="grid gap-2">
        <legend class="mb-1 text-sm font-medium">Who was there</legend>
        {#each members as member (member.id)}
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="size-4 accent-primary"
              checked={fields.isPresent(member.id)}
              onchange={(event) => fields.toggle(member.id, event.currentTarget.checked)}
            />
            {member.displayName}
          </label>
        {/each}
        {#if submission.fieldError("memberIds")}
          <p class="text-sm text-destructive">{submission.fieldError("memberIds")}</p>
        {/if}
      </fieldset>
      <div class="grid gap-1.5">
        <Label for="session-note">Note (optional)</Label>
        <Textarea id="session-note" rows={2} maxlength={500} bind:value={fields.note} />
      </div>
      {#if submission.formError}
        <p role="alert" class="text-sm text-destructive">{submission.formError}</p>
      {/if}
      <Dialog.Footer>
        <Button type="button" variant="ghost" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={submission.pending}>Log it</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
