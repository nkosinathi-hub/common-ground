<script lang="ts">
  import type { Space } from "@/features/spaces"
  import { AddTitleDialog, watchChanged } from "@/features/watch"
  let {
    open = $bindable(false),
    space,
    onAdded,
  }: {
    open: boolean
    space: Space
    onAdded: () => void
  } = $props()
</script>

<AddTitleDialog
  bind:open
  spaceId={space.id}
  defaultIntent={space.defaultWatchIntent}
  onAdded={() => {
    watchChanged(space.id)
    onAdded()
  }}
/>
