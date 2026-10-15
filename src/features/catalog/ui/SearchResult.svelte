<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { mediaKindLabel } from "../domain/rules"
  import type { CatalogTitle } from "../domain/types"
  import Poster from "./Poster.svelte"

  interface Props {
    item: CatalogTitle
    onPick: (title: CatalogTitle) => void
  }

  let { item, onPick }: Props = $props()
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
    <Button
      variant="ghost"
      size="sm"
      class="mt-2 px-0"
      aria-label={`Add ${item.title}`}
      onclick={() => onPick(item)}
    >
      <Plus aria-hidden="true" />
      Add to your space
    </Button>
  </div>
</article>
