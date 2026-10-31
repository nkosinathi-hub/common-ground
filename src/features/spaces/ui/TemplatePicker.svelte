<script lang="ts">
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import { RadioCard } from "@/shared/ui"
  import { SPACE_TEMPLATES, type SpaceTemplateId } from "../domain/templates"

  interface Props {
    value?: SpaceTemplateId
    onPick?: (id: SpaceTemplateId) => void
  }

  let { value = $bindable("couple"), onPick }: Props = $props()
</script>

<!-- Figma D19 "Kind of space": one radio card per template. -->
<div class="flex flex-col gap-related">
  <span id="kind-of-space" class="type-label text-foreground">Kind of space</span>
  <RadioGroup.Root
    aria-labelledby="kind-of-space"
    class="flex flex-col gap-related"
    {value}
    onValueChange={(next) => {
      value = next as SpaceTemplateId
      onPick?.(value)
    }}
  >
    {#each SPACE_TEMPLATES as template (template.id)}
      <RadioCard value={template.id} title={template.label} description={template.description} />
    {/each}
  </RadioGroup.Root>
</div>
