<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import * as RadioGroup from "$lib/components/ui/radio-group"

  interface Props {
    id: string
    label: string
    options: readonly (readonly [value: string, text: string])[]
    value: string
  }

  let { id, label, options, value = $bindable() }: Props = $props()
</script>

<div class="grid gap-2">
  <span id={`${id}-label`} class="text-sm font-medium">{label}</span>
  <RadioGroup.Root aria-labelledby={`${id}-label`} bind:value>
    {#each options as [option, text] (option)}
      <div class="flex items-center gap-2">
        <RadioGroup.Item value={option} id={`${id}-${option}`} />
        <Label for={`${id}-${option}`}>{text}</Label>
      </div>
    {/each}
  </RadioGroup.Root>
</div>
