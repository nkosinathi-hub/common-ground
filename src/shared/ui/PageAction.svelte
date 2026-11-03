<script lang="ts">
  import ActionButton from "./ActionButton.svelte"
  import { usePageActions, type PageActionSpec } from "./page-actions.svelte"

  let { label, icon, onclick, disabled }: PageActionSpec = $props()
  const actions = usePageActions()
  $effect(() => actions?.register({ label, icon, onclick, disabled }))
</script>

<!-- Standalone pages still expose their action, without needing an application shell. -->
{#if !actions}<ActionButton action={{ label, icon, onclick, disabled }} />{/if}
