<script lang="ts">
  import { Play } from "@lucide/svelte"
  import { PageAction, usePageActions } from "@/shared/ui"
  import { untrack, type Snippet } from "svelte"
  import type { PlaybackCatalog, PlayTarget } from "../application/ports"
  import { usePlayback } from "./context"
  import { provideTitlePlayback, TitlePlayback } from "./title-playback.svelte"

  interface Props {
    target: PlayTarget
    catalog: PlaybackCatalog
    /** After an episode or the film counts as watched, so the page reloads your place. */
    onwatched?: () => void
    /** The page: the play button, trailer and player inside it all share this title's state. */
    children: Snippet
  }

  let { target, catalog, onwatched, children }: Props = $props()
  const { service } = usePlayback()
  const shellActions = usePageActions()
  const playback = untrack(
    () =>
      new TitlePlayback(
        catalog,
        service,
        () => target,
        () => onwatched?.(),
      ),
  )
  provideTitlePlayback(playback)

  $effect(() => {
    void target
    void playback.load()
    return () => playback.cancel()
  })
</script>

{@render children()}

{#if shellActions}<PageAction
    icon={Play}
    label={playback.episodic && playback.next
      ? `Continue S${playback.next.season} E${playback.next.episode}`
      : "Play"}
    disabled={playback.play.status === "loading"}
    onclick={() => void playback.playNext()}
  />{/if}
