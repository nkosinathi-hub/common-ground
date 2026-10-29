<script lang="ts" generics="T extends string">
  import { RadioGroup } from "bits-ui"
  import type { Snippet } from "svelte"

  interface Props {
    label: string
    /** Beside the label, e.g. "Filled uses the button colour". */
    hint?: string
    options: readonly { readonly value: T; readonly label: string }[]
    value: T
    onchange: (value: T) => void
    /** Draws the small picture for an option (Figma Thumb/*). */
    thumb: Snippet<[T]>
  }

  let { label, hint, options, value, onchange, thumb }: Props = $props()
  const id = $derived(`tiles-${label.toLowerCase().replaceAll(" ", "-")}`)
</script>

<!-- Figma Option tile (229:7959): a picture and a name, the chosen one on secondary fill. -->
<div class="flex flex-col gap-related">
  <div class="flex items-baseline gap-related">
    <span class="type-label" {id}>{label}</span>
    {#if hint}<span class="type-sm text-muted-foreground">{hint}</span>{/if}
  </div>
  <RadioGroup.Root
    {value}
    onValueChange={(next) => onchange(next as T)}
    aria-labelledby={id}
    orientation="horizontal"
    class="flex flex-wrap gap-related"
  >
    {#each options as option (option.value)}
      <RadioGroup.Item
        value={option.value}
        class="flex w-29 flex-col gap-related rounded-md border border-border bg-card p-related text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 data-[state=checked]:border-2 data-[state=checked]:border-primary data-[state=checked]:bg-secondary data-[state=checked]:p-[calc(var(--space-related)-1px)]"
      >
        {@render thumb(option.value)}
        <span class="type-label-sm text-foreground">{option.label}</span>
      </RadioGroup.Item>
    {/each}
  </RadioGroup.Root>
</div>
