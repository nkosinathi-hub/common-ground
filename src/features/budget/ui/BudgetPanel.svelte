<script lang="ts">
  import type { AppError } from "@/shared/domain"
  import { ErrorState, Loading } from "@/shared/ui"
  import { budgetSummary, type BudgetEntry, type EntryForm as Form } from "../domain"
  import BudgetSummary from "./BudgetSummary.svelte"
  import BudgetTable from "./BudgetTable.svelte"
  import { useBudget } from "./context"
  import CurrencyControl from "./CurrencyControl.svelte"
  import EntryForm from "./EntryForm.svelte"

  let {
    spaceId,
    ideaId,
    currency,
    onCurrencyChanged,
  }: {
    spaceId: string
    ideaId: string
    currency: string
    onCurrencyChanged: (currency: string) => void
  } = $props()
  const budget = useBudget()
  let entries = $state<BudgetEntry[]>([])
  let loadError = $state<AppError | null>(null)
  let loading = $state(true)

  async function load() {
    loading = true
    const result = await budget.list(ideaId)
    loading = false
    if (result.ok) entries = result.value
    loadError = result.ok ? null : result.error
  }
  $effect(() => void load())

  async function add(form: Form) {
    const result = await budget.add(spaceId, ideaId, form, currency)
    if (result.ok) entries = [...entries, result.value]
    return result.ok ? null : result.error
  }
  async function remove(id: string) {
    const result = await budget.remove(id)
    if (result.ok) entries = entries.filter((e) => e.id !== id)
  }
  const summary = $derived(budgetSummary(entries, currency))
</script>

<section aria-labelledby="budget-heading" class="flex flex-col gap-3">
  <h2 id="budget-heading" class="text-lg font-semibold">Budget</h2>
  <CurrencyControl
    {ideaId}
    {currency}
    entryCount={entries.length}
    onChanged={(next) => (onCurrencyChanged(next), load())}
  />
  {#if loadError}
    <ErrorState error={loadError} onRetry={load} />
  {:else if loading}
    <Loading rows={2} />
  {:else}
    <BudgetSummary totals={summary} />
    <EntryForm {currency} onSubmit={add} />
    <BudgetTable {entries} {currency} onRemove={remove} />
  {/if}
</section>
