<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import type { WatchItem } from "../domain/types"

  let { item }: { item: WatchItem } = $props()
</script>

<!-- A title added by hand has no listings: where to watch is the space's own note (edit: ⋯). -->
<Card.Root role="region" aria-label="Where to watch">
  <Card.Header><Card.Title>Where to watch</Card.Title></Card.Header>
  <Card.Content class="flex flex-col gap-related">
    <p class="type-body text-foreground">{item.availabilityNote ?? "No note yet."}</p>
    <p class="type-xs text-muted-foreground">Added by a member, not a provider listing.</p>
  </Card.Content>
</Card.Root>
