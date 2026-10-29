<script lang="ts">
  import { untrack } from "svelte"
  import { formatMoney } from "@/shared/domain"
  import { DetailRow, Resource } from "@/shared/ui"
  import { budgetTotals } from "../domain"
  import { useBudget } from "./context"

  let { ideaId, currency }: { ideaId: string; currency: string } = $props()
  const { service } = useBudget()
  const lines = new Resource(() => service.list(untrack(() => ideaId)))
  $effect(() => {
    void ideaId
    untrack(() => void lines.load())
  })
  const totals = $derived(budgetTotals(lines.value ?? [], currency))
</script>

<!-- D06 At a glance: the estimate, once there is one. -->
{#if totals.estimated.minor > 0}
  <DetailRow label="Budget" value="{formatMoney(totals.estimated)} estimated" />
{/if}
