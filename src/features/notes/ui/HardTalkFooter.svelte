<script lang="ts">
  import { ChevronLeft, ChevronRight, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ConfirmDialog } from "@/shared/ui"
  import type { ComposerState } from "./composer-state.svelte"

  interface Props {
    composer: ComposerState
    /** Who it goes to, for the last button; empty until someone is chosen. */
    name: string
    step: number
    onstep: (step: number) => void
    onDelete: () => void
  }

  let { composer, name, step, onstep, onDelete }: Props = $props()
  let confirming = $state(false)
</script>

<!-- Figma S02 footer: delete the draft, where you are, then Back and Next, or send. -->
{#if composer.autosave.id}
  <Button variant="ghost" class="text-destructive" onclick={() => (confirming = true)}
    ><Trash2 aria-hidden="true" />Delete draft</Button
  >
{/if}
<p class="mr-auto type-sm text-muted-foreground">Step {step} of 3</p>
{#if step > 1}
  <Button variant="outline" onclick={() => onstep(step - 1)}
    ><ChevronLeft aria-hidden="true" />Back</Button
  >
{/if}
{#if step < 3}
  <Button onclick={() => onstep(step + 1)}>Next<ChevronRight aria-hidden="true" /></Button>
{:else}
  <Button type="submit" disabled={composer.sending}>{name ? `Send to ${name}` : "Send"}</Button>
{/if}
<ConfirmDialog
  bind:open={confirming}
  title="Delete this draft?"
  description="It can't be brought back."
  confirmLabel="Delete draft"
  onConfirm={onDelete}
/>
