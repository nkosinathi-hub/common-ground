<script lang="ts">
  import { Check, Info } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Input } from "$lib/components/ui/input"
  import { Textarea } from "$lib/components/ui/textarea"
  import { TitleSummary, type SummaryTitle } from "@/features/catalog"
  import { todayDateOnly, type MemberRef } from "@/shared/domain"
  import { Chip, DialogShell, FormError, FormField, FormState, toast } from "@/shared/ui"
  import { NOTE_MAX } from "../domain/validation"
  import { useWatch } from "./context"
  import { SessionFormState } from "./session-form-state.svelte"

  interface Props {
    open: boolean
    itemId: string
    title: SummaryTitle
    members: readonly MemberRef[]
    onLogged: () => void
  }

  let { open = $bindable(false), itemId, title, members, onLogged }: Props = $props()
  const { service } = useWatch()
  const fields = new SessionFormState(() => todayDateOnly())
  const submission = new FormState()

  $effect(() => {
    if (open) fields.reset(members.map((m) => m.id))
  })

  async function submit() {
    const logged = await submission.run(() => service.logSession(itemId, fields.toInput()))
    if (!logged.ok) return
    toast.success("Logged. Everyone there is marked completed.")
    open = false
    onLogged()
  }
</script>

<!-- Figma S10: the title, the day and who was there, a note, then log it. -->
<DialogShell
  bind:open
  title="Log a watch together"
  description="Keep the shared memory of {title.title}."
  primary="Log watch"
  busy={submission.pending}
  onsubmit={submit}
>
  <TitleSummary title={{ ...title, meta: "Together history" }} />
  <div class="grid gap-stack sm:grid-cols-[auto_1fr]">
    <FormField
      id="session-day"
      label="Date watched"
      width="date"
      error={submission.fieldError("watchedOn")}
    >
      {#snippet control({ id, describedby })}
        <Input
          {id}
          type="date"
          max={todayDateOnly()}
          aria-describedby={describedby}
          bind:value={fields.watchedOn}
        />
      {/snippet}
    </FormField>
    <fieldset class="flex flex-col gap-related">
      <legend class="mb-related type-label text-foreground">Who was there?</legend>
      <div class="flex flex-wrap gap-related">
        {#each members as member (member.id)}
          {@const on = fields.isPresent(member.id)}
          <Chip
            selected={on}
            icon={on ? Check : undefined}
            onclick={() => fields.toggle(member.id, !on)}>{member.displayName}</Chip
          >
        {/each}
      </div>
      <FormError message={submission.fieldError("memberIds")} alert={false} />
    </fieldset>
  </div>
  <FormField id="session-note" label="Note" optional>
    {#snippet control({ id, describedby })}
      <Textarea
        {id}
        rows={2}
        maxlength={NOTE_MAX}
        aria-describedby={describedby}
        bind:value={fields.note}
      />
    {/snippet}
  </FormField>
  <Alert.Root role="note">
    <Info aria-hidden="true" />
    <Alert.Description
      >Everyone you tick is marked as having watched it that day. Nobody else's progress changes.</Alert.Description
    >
  </Alert.Root>
  <FormError message={submission.formError} />
</DialogShell>
