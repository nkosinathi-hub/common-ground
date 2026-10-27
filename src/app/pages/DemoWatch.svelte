<script lang="ts">
  import DemoTitleDetail from "./DemoTitleDetail.svelte"
  import DemoTitleList from "./DemoTitleList.svelte"
  interface Props {
    query: string
    onAction: (action: string) => void
  }
  let { query, onAction }: Props = $props()
  let selected = $state(0)
</script>

<div class="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
  <DemoTitleList {selected} {query} onSelect={(index) => (selected = index)} /><DemoTitleDetail
    {selected}
    {onAction}
  />
</div>
