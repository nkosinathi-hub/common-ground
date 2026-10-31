<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import type { AppError } from "@/shared/domain"
  import { FormError } from "@/shared/ui"
  import type { EntryForm } from "../domain"
  import EntryFields from "./EntryFields.svelte"

  interface Props {
    currency: string
    categories: readonly string[]
    onSubmit: (form: EntryForm) => Promise<AppError | null>
  }

  let { currency, categories, onSubmit }: Props = $props()
  const blank = { category: "Travel", label: "", estimated: "", actual: "" }
  let form = $state({ ...blank })
  let error = $state<AppError | null>(null)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    error = await onSubmit(form)
    if (!error) form = { ...blank }
  }
</script>

<!-- D10 "Add budget item". -->
<Card.Root>
  <Card.Header><Card.Title id="add-budget-heading">Add budget item</Card.Title></Card.Header>
  <Card.Content>
    <form class="flex flex-col gap-stack" onsubmit={submit} aria-labelledby="add-budget-heading">
      <EntryFields id="new-line" bind:form {currency} {error} {categories} />
      <FormError message={error?.message} />
      <Button type="submit" class="self-start" disabled={!form.label.trim()}>Add</Button>
    </form>
  </Card.Content>
</Card.Root>
