<script lang="ts">
  import { FormError } from "@/shared/ui"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Plus } from "@lucide/svelte"
  import type { AppError } from "@/shared/domain"
  import { CATEGORY_MAX, LABEL_MAX, type EntryForm } from "../domain"

  interface Props {
    currency: string
    onSubmit: (form: EntryForm) => Promise<AppError | null>
  }

  let { currency, onSubmit }: Props = $props()
  const blank = { category: "", label: "", estimated: "", actual: "" }
  let form = $state({ ...blank })
  let error = $state<AppError | null>(null)
  const invalid = (field: string) => (error?.field === field ? true : undefined)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    error = await onSubmit(form)
    if (!error) form = { ...blank }
  }
</script>

<form
  class="grid gap-2 sm:grid-cols-5 sm:items-end"
  onsubmit={submit}
  aria-label="Add a budget line"
>
  <Input
    aria-label="Category"
    placeholder="Category"
    maxlength={CATEGORY_MAX}
    bind:value={form.category}
    aria-invalid={invalid("category")}
  />
  <Input
    aria-label="Item"
    placeholder="Item"
    maxlength={LABEL_MAX}
    bind:value={form.label}
    aria-invalid={invalid("label")}
  />
  <Input
    aria-label="Estimated ({currency})"
    inputmode="decimal"
    placeholder="Estimated"
    bind:value={form.estimated}
    aria-invalid={invalid("estimated")}
  />
  <Input
    aria-label="Actual ({currency})"
    inputmode="decimal"
    placeholder="Actual"
    bind:value={form.actual}
    aria-invalid={invalid("actual")}
  />
  <Button type="submit" size="sm"><Plus />Add line</Button>
  <FormError message={error?.message} class="sm:col-span-5" />
</form>
