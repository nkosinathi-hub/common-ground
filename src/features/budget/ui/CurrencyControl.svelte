<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { CURRENCIES } from "../domain"
  import { useBudget } from "./context"

  let {
    ideaId,
    currency,
    entryCount,
    onChanged,
  }: {
    ideaId: string
    currency: string
    entryCount: number
    onChanged: (currency: string) => void
  } = $props()
  const budget = useBudget()
  let next = $state(untrack(() => currency))
  let confirmClear = $state(false)
  let error = $state<string | null>(null)
  const options = $derived(
    CURRENCIES.includes(currency as never) ? CURRENCIES : [currency, ...CURRENCIES],
  )

  async function change() {
    const result = await budget.changeCurrency(ideaId, next, confirmClear)
    error = result.ok ? null : result.error.message
    if (!result.ok) return
    confirmClear = false
    onChanged(next)
  }
</script>

<div class="flex flex-wrap items-center gap-2 text-sm">
  <label class="flex items-center gap-2"
    >Currency
    <select class="h-8 rounded-lg border border-input bg-background px-2" bind:value={next}>
      {#each options as code (code)}<option value={code}>{code}</option>{/each}
    </select>
  </label>
  {#if next !== currency}
    {#if entryCount > 0}
      <label class="flex items-center gap-2 text-destructive">
        <input type="checkbox" bind:checked={confirmClear} />
        Delete all {entryCount} budget lines to switch to {next}
      </label>
    {/if}
    <Button
      size="sm"
      variant={entryCount > 0 ? "destructive" : "default"}
      disabled={entryCount > 0 && !confirmClear}
      onclick={change}>Change currency</Button
    >
  {/if}
  {#if error}<p class="w-full text-destructive" role="alert">{error}</p>{/if}
</div>
