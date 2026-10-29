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
    onchange: (value: T | "") => void
  }

  let { id, label, value, options, anyLabel, hideLabel = false, onchange }: Props = $props()
</script>

<div class="grid gap-1.5">
  <Label for={id} class={cn(hideLabel && "sr-only")}>{label}</Label>
  <NativeSelect {id} {value} onchange={(event) => onchange(event.currentTarget.value as T | "")}>
    {#if anyLabel}<option value="">{anyLabel}</option>{/if}
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </NativeSelect>
</div>
