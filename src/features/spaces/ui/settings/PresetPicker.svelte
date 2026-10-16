<script lang="ts">
  import { cn } from "$lib/utils"
  import { PRESET_LABELS, SPACE_PRESETS, type SpacePreset } from "../../domain/look"
  import type { SpaceTemplateId } from "../../domain/templates"

  interface Props {
    value: SpacePreset | null
    /** Null follows the template, so its option previews the template's palette. */
    template: SpaceTemplateId
  }

  let { value = $bindable(null), template }: Props = $props()
  const options: (SpacePreset | null)[] = [null, ...SPACE_PRESETS]
</script>

<div role="radiogroup" aria-label="Colours" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
  {#each options as preset (preset ?? "template")}
    <button
      type="button"
      role="radio"
      aria-checked={value === preset}
      data-space-theme={preset ?? template}
      onclick={() => (value = preset)}
      class={cn(
        "flex items-center gap-2 rounded-lg border bg-banner/60 p-2 text-left text-sm",
        value === preset ? "border-primary ring-2 ring-primary" : "hover:border-primary/50",
      )}
    >
      <span class="size-5 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
      <span class="font-medium text-primary">
        {preset ? PRESET_LABELS[preset] : `Template (${PRESET_LABELS[template]})`}
      </span>
    </button>
  {/each}
</div>
