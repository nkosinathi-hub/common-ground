<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import ImmersiveFrame from "./ImmersiveFrame.svelte"
  import Player from "./Player.svelte"
  import { useTitlePlayback } from "./title-playback.svelte"

  /** Names the player and its fullscreen view. */
  let { title, party = false }: { title: string; party?: boolean } = $props()
  const playback = useTitlePlayback()
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
{#if playback && (playback.play.status !== "idle" || error)}
  <ImmersiveFrame active={!party} {title} onclose={() => playback.play.close()}>
    <section
      bind:this={section}
      tabindex="-1"
      aria-label="Watch here"
      class="flex min-h-0 flex-1 scroll-mt-28 flex-col gap-related outline-none"
    >
      <header class="flex items-center justify-between gap-item">
        <div>
          <h2 class="type-label">{title}</h2>
          {#if playback.mode === "trailer"}<p class="type-sm text-muted-foreground">Trailer</p>
          {:else if playback.episodeLabel}<p class="type-sm text-muted-foreground">
              {playback.episodeLabel}
            </p>{/if}
        </div>
        {#if playback.play.status !== "ready"}<Button
            variant="ghost"
            onclick={() => playback.play.close()}>Back to title</Button
          >{/if}
      </header>
      {#if playback.play.status === "loading"}
        <p class="type-sm text-muted-foreground" role="status">Finding a source…</p>
      {/if}
      {#if error}<p class="type-sm text-destructive" role="alert">{error}</p>{/if}
      {#if playback.play.status === "ready" && playback.play.playing}
        {#key playback.play.playing}<Player
            playing={playback.play.playing}
            target={playback.target()}
            {title}
            {party}
            preview={playback.mode === "trailer"}
            onclose={() => playback.play.close()}
            onnext={(next) => void playback.continueTo(next)}
            onwatched={() => void playback.watched()}
            onretry={() => void playback.retry()}
          />{/key}
      {/if}
      {#if error}<Button variant="outline" onclick={() => void playback.retry()}
          >Retry playback</Button
        >{/if}
    </section>
  </ImmersiveFrame>
{/if}
