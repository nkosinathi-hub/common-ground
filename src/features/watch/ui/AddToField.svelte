<script lang="ts">
  import { SelectField } from "@/shared/ui"
  import { INTENTS } from "../domain/labels"
  import type { SharedIntent } from "../domain/types"

  let { value = $bindable() }: { value: SharedIntent } = $props()
  const id = $props.id()
</script>

<!-- Figma S03 and S04 "Add to": the list new titles land in. -->
<div class="sm:w-field-select sm:shrink-0">
  <SelectField {id} label="Add to" {value} options={INTENTS} onchange={(v) => (value = v)} />
</div>
