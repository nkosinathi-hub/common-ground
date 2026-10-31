<script lang="ts">
  import { Check } from "@lucide/svelte"
  import { SAVE_STATUS } from "../domain"
  import type { ComposerState } from "./composer-state.svelte"

  let { composer }: { composer: ComposerState } = $props()
  const status = $derived(composer.autosave.status)
</script>

<!-- Figma Autosave status (230:7867): beside Close, only you see the draft. -->
<p
  role="status"
  class="flex h-8 items-center gap-related type-sm text-muted-foreground"
  title="Only you can see this"
>
  {#if status === "saved"}<Check class="size-4" aria-hidden="true" />Draft saved
  {:else}{SAVE_STATUS[status]}{/if}
</p>
