<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { InitialAvatar } from "@/shared/ui"
  import { statusLabel } from "../domain/labels"
  import { placeHeading } from "../domain/places"
  import type { Progress } from "../domain/progress-types"

  interface Props {
    entry: Progress
    name: string
  }

  let { entry, name }: Props = $props()
  const place = $derived(placeHeading(entry))
</script>

<!-- D03a: someone else's place, read-only, large enough to read across the room. -->
<li class="flex flex-col gap-stack">
  <div class="flex items-center gap-item">
    <InitialAvatar {name} size="sm" decorative />
    <span class="min-w-0 flex-1 truncate type-label text-foreground">{name}</span>
    <Badge variant="secondary">{statusLabel(entry.status)}</Badge>
  </div>
  {#if place}<p class="type-h2 text-foreground">{place}</p>{/if}
  <p class="type-xs text-muted-foreground">Only {name} changes this.</p>
</li>
