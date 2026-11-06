<script lang="ts">
  import { usePlayback } from "./context"
  import MediaServerSignIn from "./MediaServerSignIn.svelte"
  import Player from "./Player.svelte"
  import { useTitlePlayback } from "./title-playback.svelte"

  /** Names the player and its fullscreen view. */
  let { title, party = false }: { title: string; party?: boolean } = $props()
  const playback = useTitlePlayback()
  const { account } = usePlayback()
  const error = $derived(playback?.play.error?.message || "")
  let section = $state<HTMLElement>()
  $effect(() => {
    const status = playback?.play.status
    if (party || (status !== "ready" && status !== "error")) return
    const frame = requestAnimationFrame(() => {
      section?.scrollIntoView?.({ block: "start" })
      const focus = section?.querySelector<HTMLElement>("[data-player-focus]") ?? section
      focus?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  })
</script>

<!-- Where the title plays, under the header: nothing shows until something is asked to play. -->
{#if playback && (account || playback.play.status !== "idle" || error)}
  <section
    bind:this={section}
    tabindex="-1"
    aria-label="Watch here"
    class="flex scroll-mt-28 flex-col gap-related outline-none"
  >
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
        {party}
        onclose={() => playback.play.close()}
        onnext={(next) => void playback.continueTo(next)}
        onwatched={() => void playback.watched()}
        onretry={() =>
          void playback.playEpisode(
            playback.play.playing?.ref.kind === "episode" ? playback.play.playing.ref : undefined,
          )}
      />
    {/if}
  </section>
{/if}
