<script lang="ts">
  import { Check, LoaderCircle } from "@lucide/svelte"
  import { formatTime } from "@/shared/domain"

  interface Props {
    /** When the draft was last saved, or null before the first save. */
    savedAt: string | null
    saving?: boolean
    /** The last save failed; another try is on its way. */
    failed?: boolean
  }

  let { savedAt, saving = false, failed = false }: Props = $props()
</script>

<!-- Figma Autosave status (230:7867): beside Close, and only the writer sees the draft. -->
<p
  role="status"
  class="flex h-8 items-center gap-related type-sm text-muted-foreground"
  title="Only you can see this"
>
  {#if failed}
    Couldn't save. Trying again
  {:else if saving}
    <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />Saving draft
  {:else if savedAt}
    <Check class="size-4" aria-hidden="true" />Draft saved {formatTime(savedAt)}
  {/if}
</p>
