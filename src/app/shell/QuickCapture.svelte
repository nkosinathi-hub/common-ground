<script lang="ts">
  import { Lightbulb, Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { openCapture } from "@/features/ideas"

  /** Icon only, for the mobile app bar. */
  let { compact = false }: { compact?: boolean } = $props()
</script>

<Button
  variant={compact ? "ghost" : "outline"}
  size={compact ? "icon-sm" : "sm"}
  class={compact ? "max-md:size-11" : undefined}
  aria-label="Capture an idea from anywhere"
  onclick={openCapture}
>
  {#if compact}<Lightbulb aria-hidden="true" />{:else}<Plus aria-hidden="true" />Capture idea{/if}
</Button>
