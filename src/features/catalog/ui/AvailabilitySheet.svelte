<script lang="ts">
  import { ChevronRight, Tv } from "@lucide/svelte"
  import * as Sheet from "$lib/components/ui/sheet"
  import type { CatalogType } from "../domain/types"
  import Availability from "./Availability.svelte"

  interface Props {
    spaceId: string
    type: CatalogType
    id: number
    title?: string
  }

  let { spaceId, type, id, title = "" }: Props = $props()
  let open = $state(false)
  let first = $state<string | null>(null)
</script>

<!-- M03c: on a phone, Where to watch is one row; the listing opens in a sheet. -->
<button
  type="button"
  class="flex min-h-14 w-full items-center gap-item rounded-lg border border-border bg-card px-inset text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
  onclick={() => (open = true)}
>
  <Tv class="size-5 text-foreground" aria-hidden="true" />
  <span class="type-label whitespace-nowrap text-foreground">Where to watch</span>
  <span class="min-w-0 flex-1 truncate text-right type-sm text-muted-foreground">{first ?? ""}</span
  >
  <ChevronRight class="size-4 text-muted-foreground" aria-hidden="true" />
</button>
<div class="hidden">
  <Availability {spaceId} {type} {id} onloaded={(listing) => (first = listing.firstProvider)} />
</div>
<Sheet.Root bind:open>
  <Sheet.Content side="bottom" class="max-h-[85dvh] overflow-y-auto p-inset">
    <Sheet.Title class="sr-only">Where to watch</Sheet.Title>
    <Availability {spaceId} {type} {id} {title} />
  </Sheet.Content>
</Sheet.Root>
