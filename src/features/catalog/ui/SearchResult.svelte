<script lang="ts">
  import { Check, LoaderCircle, Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { mediaKindLabel, type PickStatus } from "../domain/rules"
  import type { CatalogTitle } from "../domain/types"
  import Poster from "./Poster.svelte"

  interface Props {
    item: CatalogTitle
    onPick: (title: CatalogTitle) => void
    status?: PickStatus
  }

  let { item, onPick, status = "idle" }: Props = $props()
</script>

<article class="flex gap-4 py-4">
  <Poster path={item.posterPath} title={item.title} />
  <div class="min-w-0 flex-1">
    <h3 class="text-sm font-medium">{item.title}</h3>
    <p class="mt-1 text-xs text-muted-foreground">
      {mediaKindLabel(item.mediaKind)}{item.year ? ` · ${item.year}` : ""}
    </p>
    <p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
      {item.synopsis || "A story waiting to be discovered."}
    </p>
    {#if status === "added"}
      <p class="mt-2 flex h-8 items-center gap-2 text-sm font-medium text-primary">
        <Check aria-hidden="true" class="size-4" />
        Added to your space
      </p>
    {:else}
      <Button
        variant="ghost"
        size="sm"
        class="mt-2 px-0"
        aria-label={`Add ${item.title}`}
        disabled={status === "adding"}
        onclick={() => onPick(item)}
      >
        {#if status === "adding"}
          <LoaderCircle aria-hidden="true" class="animate-spin" />
          Adding
        {:else}
          <Plus aria-hidden="true" />
          Add to your space
        {/if}
      </Button>
    {/if}
  </div>
</article>
