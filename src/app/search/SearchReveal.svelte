<script lang="ts">
  import { ArrowLeft, Search, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { SEARCH_MAX } from "@/features/search"
  let {
    expanded,
    open,
    value,
    controls,
    input = $bindable(null),
    trigger = $bindable(null),
    onOpen,
    onClose,
    onInput,
    onClear,
  }: {
    expanded: boolean
    open: boolean
    value: string
    controls: string
    input?: HTMLInputElement | null
    trigger?: HTMLButtonElement | null
    onClose: () => void
    onOpen: () => void
    onInput: (value: string) => void
    onClear: () => void
  } = $props()
  const id = $props.id()
</script>

<div class="search-ice" data-expanded={expanded}>
  <Button
    bind:ref={trigger}
    variant="ghost"
    size="icon"
    class="search-opener"
    aria-label={open ? "Close search" : "Open search"}
    aria-expanded={open}
    aria-controls={open ? controls : undefined}
    onclick={open ? onClose : onOpen}
  >
    {#if open}<ArrowLeft class="size-5" aria-hidden="true" />{:else}<Search
        class="size-5"
        aria-hidden="true"
      />{/if}</Button
  >
  <div class="search-entry" inert={!expanded} aria-hidden={!expanded}>
    <label for={id} class="sr-only">Search everything</label>
    <Input
      {id}
      bind:ref={input}
      type="search"
      {value}
      maxlength={SEARCH_MAX}
      placeholder="Search anything…"
      aria-controls={open ? controls : undefined}
      class="h-11 border-0 bg-transparent pr-11 shadow-none focus-visible:ring-0"
      onfocus={onOpen}
      oninput={(event) => onInput(event.currentTarget.value)}
    />
    {#if value}<Button
        variant="ghost"
        size="icon"
        class="search-clear"
        aria-label="Clear search"
        onclick={onClear}><X aria-hidden="true" /></Button
      >{/if}
  </div>
</div>
