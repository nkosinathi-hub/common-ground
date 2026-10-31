<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    page: number
    totalPages: number
    disabled?: boolean
    onPage: (page: number) => void
  }

  let { page, totalPages, disabled = false, onPage }: Props = $props()
</script>

<nav
  class="flex items-center justify-between type-xs text-muted-foreground"
  aria-label="Search pages"
>
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label="Previous results"
    disabled={disabled || page <= 1}
    onclick={() => onPage(page - 1)}
  >
    <ChevronLeft aria-hidden="true" />
  </Button>
  <span>Page {page} of {totalPages}</span>
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label="Next results"
    disabled={disabled || page >= totalPages}
    onclick={() => onPage(page + 1)}
  >
    <ChevronRight aria-hidden="true" />
  </Button>
</nav>
