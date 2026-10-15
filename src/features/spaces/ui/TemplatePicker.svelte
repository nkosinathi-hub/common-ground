<script lang="ts">
  import { cn } from "$lib/utils"
  import { SPACE_TEMPLATES, type SpaceTemplateId } from "../domain/templates"

  let {
    value = $bindable("couple"),
    onPick,
  }: {
    value?: SpaceTemplateId
    onPick?: (id: SpaceTemplateId) => void
  } = $props()
</script>

<div role="radiogroup" aria-label="Kind of space" class="grid gap-3 sm:grid-cols-2">
  {#each SPACE_TEMPLATES as template (template.id)}
    <button
      type="button"
      role="radio"
      aria-checked={value === template.id}
      data-space-theme={template.id}
      onclick={() => {
        value = template.id
        onPick?.(template.id)
      }}
      class={cn(
        "rounded-xl border bg-banner/60 p-4 text-left transition-shadow",
        value === template.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50",
      )}
    >
      <span class="block font-semibold text-primary">{template.label}</span>
      <span class="block text-xs text-muted-foreground">{template.audience}</span>
      <span class="mt-2 block text-sm">{template.description}</span>
    </button>
  {/each}
</div>
