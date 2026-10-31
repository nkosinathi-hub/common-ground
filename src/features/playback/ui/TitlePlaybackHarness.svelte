<script lang="ts">
  import type { PlaybackCatalog, PlayTarget } from "../application/ports"
  import PlayerSlot from "./PlayerSlot.svelte"
  import PlaySplitButton from "./PlaySplitButton.svelte"
  import TitlePlaybackScope from "./TitlePlaybackScope.svelte"
  import TrailerButton from "./TrailerButton.svelte"

  /** Tests only: the title page's playback pieces, as WatchSection puts them together. */
  let { target, catalog }: { target: PlayTarget; catalog: PlaybackCatalog } = $props()
</script>

<TitlePlaybackScope {target} {catalog}>
  <PlaySplitButton /><TrailerButton /><PlayerSlot title="Film" />
</TitlePlaybackScope>
