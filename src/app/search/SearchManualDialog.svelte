<script lang="ts">
  import type { Space } from "@/features/spaces"
  import { AddTitleDialog, watchChanged } from "@/features/watch"
  let {
    open = $bindable(false),
    space,
    onAdded,
    restoreFocus,
  }: {
    open: boolean
    space: Space
    onAdded: () => void
    restoreFocus: () => void
  } = $props()
</script>

<AddTitleDialog
  bind:open
  spaceId={space.id}
  defaultIntent={space.defaultWatchIntent}
  onCloseAutoFocus={(event) => {
    event.preventDefault()
    restoreFocus()
  }}
  onAdded={() => {
    watchChanged(space.id)
    onAdded()
  }}
/>
