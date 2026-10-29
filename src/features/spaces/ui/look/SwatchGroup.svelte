<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { RadioGroup } from "bits-ui"
  import * as Popover from "$lib/components/ui/popover"
  import { cn } from "$lib/utils"
  import type { PickKind } from "../../domain/pick-check"
  import { swatchName, type SpaceLook, type Swatch } from "../../domain/space-look"
  import ColourPicker from "./ColourPicker.svelte"

  interface Props {
    kind: PickKind
    label: string
    swatches: readonly Swatch[]
    /** Null is the first swatch, the design default. */
    value: string | null
    look: SpaceLook
    onchange: (hex: string | null) => void
  }

  let { kind, label, swatches, value, look, onchange }: Props = $props()
  const current = $derived(value ?? swatches[0]!.hex)
  const custom = $derived(!swatches.some((s) => s.hex === current))
  let picking = $state(false)
  let anchor = $state<HTMLElement | null>(null)
  const choose = (hex: string) => onchange(hex === swatches[0]!.hex ? null : hex)
  const ring =
    "flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30 data-[state=checked]:ring-2 data-[state=checked]:ring-ring"
</script>

<!-- Figma Swatch (229:7948): a colour circle, ringed when chosen, and a custom one that opens the picker. -->
<div class="flex flex-col gap-related">
  <div class="flex items-baseline gap-related">
    <span class="type-label" id="{kind}-label">{label}</span>
    <span class="type-sm text-muted-foreground">{swatchName(swatches, value)}</span>
  </div>
  <RadioGroup.Root
    value={custom ? "custom" : current}
    onValueChange={(next) => next !== "custom" && choose(next)}
    aria-labelledby="{kind}-label"
    orientation="horizontal"
    class="flex flex-wrap gap-related"
  >
    {#each swatches as swatch (swatch.hex)}
      <RadioGroup.Item value={swatch.hex} aria-label={swatch.name} class={ring}>
        <span class="size-7 rounded-full border border-foreground/10" style:background={swatch.hex}
        ></span>
      </RadioGroup.Item>
    {/each}
    <!-- A plain radio that opens the picker, so no popup attributes land on the radio. -->
    <RadioGroup.Item
      bind:ref={anchor}
      value="custom"
      aria-label="Custom colour"
      class={ring}
      onclick={() => (picking = true)}
    >
      <span
        class={cn(
          "flex size-7 items-center justify-center rounded-full border border-border",
          !custom && "bg-card",
        )}
        style:background={custom ? current : undefined}
      >
        {#if !custom}<Plus class="size-4 text-muted-foreground" aria-hidden="true" />{/if}
      </span>
    </RadioGroup.Item>
    <Popover.Root bind:open={picking}>
      <Popover.Content
        class="w-72 p-0"
        align="start"
        customAnchor={anchor}
        aria-label="{label} colour"
      >
        <ColourPicker
          {kind}
          {look}
          start={current}
          onpick={(hex) => (choose(hex), (picking = false))}
        />
      </Popover.Content>
    </Popover.Root>
  </RadioGroup.Root>
</div>
