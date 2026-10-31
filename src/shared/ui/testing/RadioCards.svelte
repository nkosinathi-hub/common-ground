<script lang="ts">
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import RadioCard from "../RadioCard.svelte"

  let { value = $bindable("couple") }: { value?: string } = $props()
</script>

<RadioGroup.Root bind:value aria-label="Template">
  <RadioCard value="couple" title="Couple" description="One private place." />
  <RadioCard value="friends" title="Friends" />
</RadioGroup.Root>
