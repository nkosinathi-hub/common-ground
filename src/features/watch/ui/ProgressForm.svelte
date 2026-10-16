<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { todayDateOnly } from "@/shared/domain"
  import { FormError, FormState, toast } from "@/shared/ui"
  import { STATUSES } from "../domain/labels"
  import { RATING_MAX } from "../domain/validation"
  import type { Progress } from "../domain/types"
  import Choice from "./Choice.svelte"
  import { useWatch } from "./context"
  import { ProgressFormState } from "./progress-form.svelte"

  const RATINGS = Array.from({ length: RATING_MAX }, (_, index) => String(index + 1)).map(
    (value) => ({ value, label: `${value} of ${RATING_MAX}` }),
  )

  interface Props {
    itemId: string
    episodic: boolean
    mine: Progress | null
    onSaved: () => void
  }

  let { itemId, episodic, mine, onSaved }: Props = $props()
  const { service } = useWatch()
  const fields = new ProgressFormState(() => todayDateOnly())
  const submission = new FormState()

  $effect(() => fields.reset(mine))

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const saved = await submission.run(async () => {
      const input = fields.toInput()
      return input.ok ? service.saveProgress(itemId, input.value) : input
    })
    if (!saved.ok) return
    toast.success("Progress saved")
    onSaved()
  }
</script>

{#snippet problem(field: string)}
  <FormError message={submission.fieldError(field)} alert={false} />
{/snippet}

<form class="grid gap-3" onsubmit={submit} novalidate aria-label="My progress">
  <p class="text-xs text-muted-foreground">
    Only you change this. Everyone in the space can see it.
  </p>
  <div class="grid grid-cols-2 gap-3">
    <Choice
      id="progress-status"
      label="Status"
      value={fields.status}
      options={STATUSES}
      onchange={(value) => fields.setStatus(value || "not_started")}
    />
    <Choice
      id="progress-rating"
      label="Your rating"
      value={fields.rating}
      options={RATINGS}
      anyLabel="No rating"
      onchange={(value) => (fields.rating = value)}
    />
  </div>
  {#if episodic}
    <div class="grid grid-cols-2 gap-3">
      <div class="grid gap-1.5">
        <Label for="progress-season">Season</Label>
        <Input id="progress-season" inputmode="numeric" bind:value={fields.season} />
      </div>
      <div class="grid gap-1.5">
        <Label for="progress-episode">Episode</Label>
        <Input id="progress-episode" inputmode="numeric" bind:value={fields.episode} />
      </div>
    </div>
    {@render problem("season")}
    {@render problem("episode")}
  {/if}
  {#if fields.status === "completed"}
    <div class="grid gap-1.5">
      <Label for="progress-completed">Finished on</Label>
      <Input id="progress-completed" type="date" bind:value={fields.completedOn} />
      {@render problem("completedOn")}
    </div>
  {/if}
  {@render problem("rating")}
  <FormError message={submission.formError} />
  <Button type="submit" class="justify-self-start" disabled={submission.pending}
    >Save my progress</Button
  >
</form>
