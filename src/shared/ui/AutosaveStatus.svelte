<script lang="ts">
  import { Check, LoaderCircle } from "@lucide/svelte"
  import { formatTime } from "@/shared/domain"

  interface Props {
    /** When the draft was last saved, or null before the first save. */
    savedAt: string | null
    saving?: boolean
  }

  let { savedAt, saving = false }: Props = $props()
</script>

<!-- Figma Autosave status (230:7867). -->
<p class="flex items-center gap-related type-sm text-muted-foreground" aria-live="polite">
  {#if saving}
    <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />Saving draft
  {:else if savedAt}
    <Check class="size-4" aria-hidden="true" />Draft saved {formatTime(savedAt)}
  {/if}
</p>
