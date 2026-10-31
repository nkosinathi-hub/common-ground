<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import type { AppError } from "@/shared/domain"
  import { CATEGORY_MAX, LABEL_MAX, SUGGESTED_CATEGORIES, type EntryForm } from "../domain"

  interface Props {
    /** Prefixes the ids, so the add card and an open edit never share one. */
    id: string
    form: EntryForm
    currency: string
    error: AppError | null
    /** Categories already in this budget, offered after the suggested ones. */
    categories: readonly string[]
  }

  let { id, form = $bindable(), currency, error, categories }: Props = $props()
  const invalid = (field: string) => (error?.field === field ? true : undefined)
  const options = $derived([...new Set([...SUGGESTED_CATEGORIES, ...categories])])
</script>

<!-- D10 budget item fields, two by two: category and item, then estimated and actual. -->
<div class="grid gap-stack sm:grid-cols-2">
  <div class="flex flex-col gap-related">
    <Label for="{id}-category">Category</Label>
    <Input
      id="{id}-category"
      list="{id}-categories"
      maxlength={CATEGORY_MAX}
      bind:value={form.category}
      aria-invalid={invalid("category")}
    />
    <datalist id="{id}-categories"
      >{#each options as option (option)}<option value={option}></option>{/each}</datalist
    >
  </div>
  <div class="flex flex-col gap-related">
    <Label for="{id}-item">Item</Label>
    <Input
      id="{id}-item"
      placeholder="e.g. Transport"
      maxlength={LABEL_MAX}
      bind:value={form.label}
      aria-invalid={invalid("label")}
    />
  </div>
  <div class="flex flex-col gap-related">
    <Label for="{id}-estimated">Estimated ({currency})</Label>
    <Input
      id="{id}-estimated"
      inputmode="decimal"
      placeholder="0.00"
      bind:value={form.estimated}
      aria-invalid={invalid("estimated")}
    />
  </div>
  <div class="flex flex-col gap-related">
    <Label for="{id}-actual">Actual (optional)</Label>
    <Input
      id="{id}-actual"
      inputmode="decimal"
      placeholder="Not entered"
      bind:value={form.actual}
      aria-invalid={invalid("actual")}
    />
  </div>
</div>
