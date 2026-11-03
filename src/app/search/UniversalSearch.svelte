<script lang="ts">
  import { onDestroy, tick, untrack } from "svelte"
  import { SearchState, useSearch } from "@/features/search"
  import type { Space } from "@/features/spaces"
  import { useSearchControl } from "@/shared/ui"
  import SearchManualDialog from "./SearchManualDialog.svelte"
  import SearchReveal from "./SearchReveal.svelte"
  import SearchPanel from "./SearchPanel.svelte"
  import { searchKeys } from "./search-keys"
  let { space, expanded = $bindable(false) }: { space: Space; expanded?: boolean } = $props()
  const search = new SearchState(useSearch(), () => space.id)
  const control = useSearchControl()
  let root = $state<HTMLElement>(),
    input = $state<HTMLInputElement | null>(null),
    trigger = $state<HTMLButtonElement | null>(null)
  let open = $state(false),
    manual = $state(false),
    hovered = $state(false)
  $effect(() => {
    expanded = open || hovered
  })
  const id = $props.id()
  function focus() {
    open = true
    void tick().then(() => input?.focus())
  }
  function close() {
    open = hovered = false
    trigger?.focus()
  }
  $effect(() => control?.register(focus))
  $effect(() => {
    void space.id
    untrack(() => {
      search.input("")
      open = hovered = false
    })
  })
  onDestroy(() => search.dispose())
</script>

<svelte:window
  onkeydown={(event) => searchKeys(event, { root, input, open, focus, close })}
  onpointerdown={(event) => {
    if (event.target instanceof Node && !root?.contains(event.target)) open = hovered = false
  }}
/>
<div
  bind:this={root}
  role="search"
  aria-label="Workspace"
  class="search-reveal"
  data-expanded={expanded}
  onpointerenter={(event) => {
    if (event.pointerType === "mouse") hovered = true
  }}
  onpointerleave={() => (hovered = false)}
>
  <SearchReveal
    {expanded}
    {open}
    value={search.query}
    controls={`${id}-results`}
    bind:input
    bind:trigger
    onOpen={focus}
    onClose={close}
    onInput={(value) => {
      open = true
      search.input(value)
    }}
    onClear={() => {
      search.input("")
      focus()
    }}
  />
  {#if open}<div id={`${id}-results`}>
      <SearchPanel
        {space}
        {search}
        onOpen={() => (open = hovered = false)}
        onManual={() => {
          open = hovered = false
          manual = true
        }}
      />
    </div>{/if}
</div>
<SearchManualDialog
  bind:open={manual}
  {space}
  restoreFocus={() => trigger?.focus()}
  onAdded={() => search.query.trim().length >= 2 && void search.load()}
/>
