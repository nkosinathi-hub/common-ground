<script lang="ts">
  import { cn } from "$lib/utils"
  import { SPACE_TEMPLATES, type SpaceTemplateId } from "../domain/templates"

  interface Props {
    value?: SpaceTemplateId
    onPick?: (id: SpaceTemplateId) => void
  }

  let { value = $bindable("couple"), onPick }: Props = $props()

  function choose(id: SpaceTemplateId) {
    value = id
    onPick?.(id)
  }
</script>

<div role="radiogroup" aria-label="Kind of space" class="grid gap-3 sm:grid-cols-2">
  {#each SPACE_TEMPLATES as template (template.id)}
    <button
      type="button"
      role="radio"
      aria-checked={value === template.id}
      data-space-theme={template.id}
      onclick={() => choose(template.id)}
      class={cn(
        "rounded-xl border bg-secondary p-4 text-left transition-shadow",
        value === template.id ? "border-primary ring-2 ring-primary" : "hover:border-primary/50",
      )}
    >
      <span class="block font-semibold text-primary">{template.label}</span>
      <span class="block text-xs text-muted-foreground">{template.audience}</span>
      <span class="mt-2 block text-sm">{template.description}</span>
    </button>
  {/each}
</div>
