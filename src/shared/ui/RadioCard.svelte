<script lang="ts">
  import { RadioGroup as RadioGroupPrimitive } from "bits-ui"
  import type { Snippet } from "svelte"
  import { cn } from "$lib/utils"

  interface Props {
    value: string
    title: string
    description?: string
    /** Extra content under the text, e.g. a preview. */
    children?: Snippet
    disabled?: boolean
    class?: string
  }

  let { value, title, description, children, disabled, class: className }: Props = $props()
</script>

<!-- Figma Radio card (210:4463): one choice of a RadioGroup.Root, the whole card selectable. -->
<RadioGroupPrimitive.Item
  {value}
  {disabled}
  class={cn(
    "group/radio-card flex w-full items-start gap-item rounded-md border border-border bg-card px-inset py-item text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-secondary",
    className,
  )}
>
  <span
    aria-hidden="true"
    class="relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-card group-data-[state=checked]/radio-card:border-primary"
  >
    <span
      class="size-2 rounded-full bg-primary opacity-0 group-data-[state=checked]/radio-card:opacity-100"
    ></span>
  </span>
  <span class="flex min-w-0 flex-1 flex-col gap-0.5">
    <span class="type-label text-foreground">{title}</span>
    {#if description}<span class="type-sm text-muted-foreground">{description}</span>{/if}
    {@render children?.()}
  </span>
</RadioGroupPrimitive.Item>
