<script lang="ts" generics="T extends string">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Label } from "$lib/components/ui/label"
  import { cn } from "$lib/utils"

  interface Props {
    id: string
    label: string
    value: T | ""
    options: readonly { value: T; label: string }[]
    /** When set, an extra first option with value "" (for example "All lists"). */
    anyLabel?: string
    hideLabel?: boolean
    /** Set to "w-full" to fill the field's column; it fits its options otherwise. */
    class?: string
    onchange: (value: T | "") => void
  }

  let {
    id,
    label,
    value,
    options,
    anyLabel,
    hideLabel = false,
    class: className,
    onchange,
  }: Props = $props()
</script>

<div class="grid gap-related">
  <Label for={id} class={cn(hideLabel && "sr-only")}>{label}</Label>
  <NativeSelect
    {id}
    {value}
    class={className}
    onchange={(event) => onchange(event.currentTarget.value as T | "")}
  >
    {#if anyLabel}<option value="">{anyLabel}</option>{/if}
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </NativeSelect>
</div>
