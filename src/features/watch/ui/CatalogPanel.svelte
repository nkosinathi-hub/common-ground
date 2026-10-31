<script lang="ts">
  import { CatalogSearch } from "@/features/catalog"
  import type { Result } from "@/shared/domain"
  import type { SharedIntent } from "../domain/types"
  import type { AddTitleState } from "./add-title-state.svelte"
  import AddToField from "./AddToField.svelte"

  interface Props {
    spaceId: string
    adds: AddTitleState
    intent: SharedIntent
    onresult: (result: Result<string> | null) => void
  }

  let { spaceId, adds, intent = $bindable(), onresult }: Props = $props()
</script>

{#snippet addTo()}<AddToField bind:value={intent} />{/snippet}

<!-- Figma S03: search beside "Add to", add as many as you like, then the way out by hand. -->
<CatalogSearch
  {spaceId}
  beside={addTo}
  onPick={async (title) => onresult(await adds.pick(title))}
  statusOf={(title) => adds.statusOf(title)}
/>
<p class="type-sm text-muted-foreground">Can't find it? Use Enter manually to add it by hand.</p>
