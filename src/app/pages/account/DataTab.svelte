<script lang="ts">
  import { untrack } from "svelte"
  import { DataExportCard, DeleteAccountCard } from "@/features/account"
  import { Attribution } from "@/features/catalog"
  import { SimklCard } from "@/features/simkl"
  import { useSpaces } from "@/features/spaces"
  import { ownedWithOthers } from "./owned-with-others"
  import PrivacyCard from "./PrivacyCard.svelte"

  let { onDeleted }: { onDeleted: () => void } = $props()
  const { service, store } = useSpaces()
  const spaces = $derived(store.spaces.map((s) => ({ id: s.id, name: s.name })))
  let blockers = $state<string[]>([])
  $effect(() => {
    const mine = store.spaces
    untrack(() => void ownedWithOthers(service, mine).then((names) => (blockers = names)))
  })
</script>

<!-- Figma D18b: downloads, privacy and Simkl on the left; deleting the account on the right. -->
<div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
  <div class="flex flex-col gap-columns">
    <DataExportCard {spaces}>
      {#snippet footer()}
        <div class="border-t border-border pt-stack"><Attribution compact /></div>
      {/snippet}
    </DataExportCard>
    <PrivacyCard />
    <SimklCard />
  </div>
  <DeleteAccountCard {onDeleted} {blockers} />
</div>
