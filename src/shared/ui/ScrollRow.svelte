<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    /** Names the list, e.g. "Titles in progress". */
    label: string
    /** The `<li>` items, each a fixed width. */
    children: Snippet
  }

  let { label, children }: Props = $props()
  let row = $state<HTMLUListElement>()
  let atStart = $state(true)
  let atEnd = $state(true)

  function measure() {
    if (!row) return
    atStart = row.scrollLeft <= 1
    atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 1
  }
  $effect(() => {
    if (!row) return
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(row)
    return () => resize.disconnect()
  })
  const page = (direction: 1 | -1) =>
    row?.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: "smooth" })
</script>

<!-- One row of fixed-width items: swiped on touch, moved with the arrows where there is a pointer. -->
<div class="relative">
  <ul
    bind:this={row}
    aria-label={label}
    onscroll={measure}
    class="-mx-card flex snap-x snap-mandatory scroll-px-card [scrollbar-width:none] gap-item overflow-x-auto px-card pb-1"
  >
    {@render children()}
  </ul>
  <!-- Beside the section title above the row, never over a card. -->
  <div class="absolute -top-12 right-0 hidden gap-hairline pointer-fine:flex">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Previous in {label}"
      disabled={atStart}
      onclick={() => page(-1)}
    >
      <ChevronLeft />
    </Button>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Next in {label}"
      disabled={atEnd}
      onclick={() => page(1)}
    >
      <ChevronRight />
    </Button>
  </div>
</div>
