<script lang="ts">
  import { untrack } from "svelte"
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { ConfirmDialog, FormError } from "@/shared/ui"
  import { currencyOptions } from "../domain"
  import { useBudget } from "./context"

  interface Props {
    ideaId: string
    currency: string
    entryCount: number
    onChanged: (currency: string) => void
  }

  let { ideaId, currency, entryCount, onChanged }: Props = $props()
  const { service } = useBudget()
  let pending = $state<string | null>(null)
  let confirming = $state(false)
  // What the select shows; it goes back to the budget's currency when a switch is cancelled.
  let shown = $state(untrack(() => currency))
  $effect(() => {
    if (!confirming) shown = currency
  })
  let error = $state<string | null>(null)
  const options = $derived(currencyOptions(currency))

  async function change(next: string, clear: boolean) {
    const result = await service.changeCurrency(ideaId, next, clear)
    error = result.ok ? null : result.error.message
    if (result.ok) onChanged(next)
  }
  /** With lines in it, the budget only switches after a destructive confirmation. */
  function choose(next: string) {
    if (next === currency) return
    if (entryCount === 0) return void change(next, false)
    pending = next
    confirming = true
  }
</script>

<!-- The budget's currency in the card's title line (D10). -->
<NativeSelect aria-label="Currency" bind:value={shown} onchange={() => choose(shown)}>
  {#each options as code (code)}<option value={code}>{code}</option>{/each}
</NativeSelect>
<FormError message={error} />
<ConfirmDialog
  bind:open={confirming}
  title="Switch to {pending}?"
  description="This deletes all {entryCount} budget lines, because amounts in {currency} cannot be converted."
  confirmLabel="Delete lines and switch"
  onConfirm={async () => {
    if (pending) await change(pending, true)
    confirming = false
  }}
/>
