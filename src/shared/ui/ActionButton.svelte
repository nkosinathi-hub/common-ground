<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import type { PageActionSpec } from "./page-actions.svelte"
  import RevealContent from "./RevealContent.svelte"

  let { action, compact = false }: { action: PageActionSpec; compact?: boolean } = $props()
</script>

<Button
  disabled={action.disabled}
  variant="ghost"
  size="icon"
  class="reveal-trigger rounded-full"
  aria-label={action.label}
  onclick={action.onclick}
>
  <RevealContent icon={action.icon} label={action.label} {compact} touchLabel={!compact} />
</Button>
