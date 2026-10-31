<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import type { AddMode } from "./add-title-copy"

  interface Props {
    mode: AddMode
    /** A title typed and nothing saving yet. */
    canAdd: boolean
    ondone: () => void
    oncancel: () => void
  }

  let { mode, canAdd, ondone, oncancel }: Props = $props()
</script>

<!-- S03: Done; S04: Cancel back to the search, then Add title. Sources are credited under Account. -->
{#if mode === "search"}
  <Button onclick={ondone}>Done</Button>
{:else}
  <Button variant="outline" onclick={oncancel}>Cancel</Button>
  <Button type="submit" disabled={!canAdd}>Add title</Button>
{/if}
