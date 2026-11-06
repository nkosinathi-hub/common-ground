<script lang="ts">
  import ActionButton from "./ActionButton.svelte"
  import { usePageActions, type PageActionSpec } from "./page-actions.svelte"

  let { label, icon, onclick, disabled, order }: PageActionSpec = $props()
  const actions = usePageActions()
  $effect(() => actions?.registerTool({ label, icon, onclick, disabled, order }))
</script>

{#if !actions}<ActionButton action={{ label, icon, onclick, disabled }} />{/if}
