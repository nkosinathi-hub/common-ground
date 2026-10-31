<script lang="ts">
  import { Button } from "$lib/components/ui/button"

  interface Props {
    step: number
    total: number
    onback?: () => void
    onnext: () => void
    /** "Next" until the last step, where it names what happens, e.g. "Send". */
    nextLabel?: string
    busy?: boolean
  }

  let { step, total, onback, onnext, nextLabel = "Next", busy = false }: Props = $props()
</script>

<!-- Figma Step indicator (200:2513). -->
<div class="flex items-center gap-item">
  <p class="min-w-0 flex-1 type-sm text-muted-foreground" aria-live="polite">
    Step {step} of {total}
  </p>
  {#if step > 1 && onback}
    <Button variant="outline" onclick={onback} disabled={busy}>Back</Button>
  {/if}
  <Button onclick={onnext} disabled={busy}>{nextLabel}</Button>
</div>
