<script lang="ts">
  import { untrack } from "svelte"
  import type { AppError } from "@/shared/domain"
  import { AsyncView, Resource } from "@/shared/ui"
  import { budgetTotals, type BudgetEntry, type EntryForm as Form } from "../domain"
  import BudgetSummary from "./BudgetSummary.svelte"
  import BudgetTable from "./BudgetTable.svelte"
  import { STALE_COPY } from "./conflict"
  import { useBudget } from "./context"
  import CurrencyControl from "./CurrencyControl.svelte"
  import EntryForm from "./EntryForm.svelte"

  interface Props {
    spaceId: string
    ideaId: string
    currency: string
    /** Whether the viewer may delete a line by this author (the author or the space owner). */
    canDelete: (createdBy: string | null) => boolean
    onCurrencyChanged: (currency: string) => void
  }

  let { spaceId, ideaId, currency, canDelete, onCurrencyChanged }: Props = $props()
  const { service } = useBudget()
  const lines = new Resource<BudgetEntry[]>(() => service.list(untrack(() => ideaId)))
  /** A refused delete or a lost edit race; form errors stay on their form. */
  let notice = $state<string | null>(null)
  // Reloads when the page shows another idea.
  $effect(() => {
    void ideaId
    untrack(() => void lines.load())
  })
  const entries = () => lines.value ?? []
  const totals = $derived(budgetTotals(lines.value ?? [], currency))

  async function add(form: Form): Promise<AppError | null> {
    const added = service.add({ spaceId, ideaId, currency }, form)
    return lines.apply(added, (line, list = []) => [...list, line])
  }

  /** A stale edit shows the conflict copy and reloads the lines; other errors stay on the row. */
  async function edit(base: BudgetEntry, form: Form): Promise<AppError | null> {
    const failure = await lines.apply(service.update(base, form, currency), (saved, list = []) =>
      list.map((line) => (line.id === base.id ? saved : line)),
    )
    if (!failure || failure.kind !== "conflict") return failure
    notice = STALE_COPY
    await lines.load()
    return null
  }

  async function remove(id: string) {
    const failure = await lines.apply(service.remove(id), (_done, list = []) =>
      list.filter((line) => line.id !== id),
    )
    notice = failure?.message ?? null
  }

  function currencyChanged(next: string) {
    onCurrencyChanged(next)
    void lines.load()
  }
</script>

<section aria-labelledby="budget-heading" class="flex flex-col gap-3">
  <h2 id="budget-heading" class="text-lg font-semibold">Budget</h2>
  <CurrencyControl {ideaId} {currency} entryCount={entries().length} onChanged={currencyChanged} />
  <AsyncView resource={lines}>
    {#snippet children(list)}
      <BudgetSummary {totals} />
      <EntryForm {currency} onSubmit={add} />
      <BudgetTable entries={list} {currency} {canDelete} onEdit={edit} onRemove={remove} />
    {/snippet}
  </AsyncView>
  {#if notice}<p class="text-sm text-destructive" role="alert">{notice}</p>{/if}
</section>
