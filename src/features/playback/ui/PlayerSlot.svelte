<script lang="ts">
  import { usePlayback } from "./context"
  import MediaServerSignIn from "./MediaServerSignIn.svelte"
  import Player from "./Player.svelte"
  import { useTitlePlayback } from "./title-playback.svelte"

  /** Names the player and its fullscreen view. */
  let { title }: { title: string } = $props()
  const playback = useTitlePlayback()
  const { account } = usePlayback()
  const error = $derived(playback?.choices.error || playback?.play.error?.message || "")
</script>

<!-- Where the title plays, under the header: nothing shows until something is asked to play. -->
{#if playback && (account || playback.play.status !== "idle" || error)}
  <section aria-label="Watch here" class="flex flex-col gap-related">
    {#if account}<div class="self-start"><MediaServerSignIn {account} /></div>{/if}
    {#if playback.play.status === "loading"}
      <p class="type-sm text-muted-foreground" role="status">Finding a source…</p>
    {/if}
    {#if error}<p class="type-sm text-destructive" role="alert">{error}</p>{/if}
    {#if playback.play.status === "ready" && playback.play.playing}
      <Player
        playing={playback.play.playing}
        target={playback.target()}
        {title}
        onclose={() => playback.play.close()}
        onnext={(next) => void playback.continueTo(next)}
        onwatched={() => void playback.watched()}
      />
    {/if}
  </section>
{/if}
