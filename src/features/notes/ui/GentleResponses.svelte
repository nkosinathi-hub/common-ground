<script lang="ts">
  import { FormError } from "@/shared/ui"
  import { Button } from "$lib/components/ui/button"
  import type { AppError } from "@/shared/domain"
  import { REMINDERS, RESPONSES, responseLabel, type RemindIn, type ResponseKind } from "../domain"

  interface Props {
    respond: (kind: ResponseKind, remindIn: RemindIn | null) => Promise<AppError | null>
    onResponded: (kind: ResponseKind) => void
  }

  let { respond, onResponded }: Props = $props()
  let asking = $state(false)
  let sent = $state<ResponseKind | null>(null)
  let error = $state<string | null>(null)
  let busy = $state(false)

  async function send(kind: ResponseKind, remindIn: RemindIn | null = null) {
    asking = false
    busy = true
    const failure = await respond(kind, remindIn)
    busy = false
    error = failure?.message ?? null
    if (failure) return
    sent = kind
    onResponded(kind)
  }

  /** "I need a little time" asks about a reminder first; it is sent once they choose. */
  const choose = (kind: ResponseKind) => (kind === "time" ? (asking = true) : void send(kind))

  // Closing before choosing still sends "I need a little time", without a reminder.
  $effect(() => () => {
    if (asking) void respond("time", null)
  })
</script>

<div class="grid gap-related" role="group" aria-labelledby="gentle-heading">
  <h3 id="gentle-heading" class="type-label">When you're ready</h3>
  {#each RESPONSES as response (response.value)}
    <Button
      variant="outline"
      class="h-auto min-h-11 justify-start text-left whitespace-normal"
      disabled={busy}
      aria-pressed={asking && response.value === "time" ? true : undefined}
      onclick={() => choose(response.value)}>{response.label}</Button
    >
  {/each}
  {#if asking}
    <div
      class="grid gap-related rounded-lg bg-muted p-item"
      role="group"
      aria-labelledby="reminder-ask"
    >
      <p id="reminder-ask" class="type-sm">Want a gentle reminder?</p>
      <div class="flex flex-wrap gap-related">
        {#each REMINDERS as reminder (reminder.label)}
          <Button
            size="sm"
            variant="secondary"
            class="min-h-11"
            onclick={() => send("time", reminder.days)}>{reminder.label}</Button
          >
        {/each}
      </div>
    </div>
  {/if}
  <p role="status" class="type-sm text-muted-foreground">
    {sent ? `Sent: ${responseLabel(sent)}` : ""}
  </p>
  <FormError message={error} />
</div>
