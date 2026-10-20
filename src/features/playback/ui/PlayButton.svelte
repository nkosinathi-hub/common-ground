<script lang="ts">
  import { Play } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { PlayTarget } from "../application/ports"
  import { usePlayback } from "./context"
  import MediaServerSignIn from "./MediaServerSignIn.svelte"
  import { PlayState } from "./play-state.svelte"
  import Player from "./Player.svelte"

  interface Props {
    target: PlayTarget
    title: string
  }

  let { target, title }: Props = $props()
  const { service, account } = usePlayback()
  const play = new PlayState(service, () => target)
  const label = $derived(target.catalog.type === "tv" ? "Play next episode" : "Play")
</script>

<!-- Playback starts from the player's own controls, a user gesture, as iOS Safari requires. -->
<section aria-label="Watch here" class="space-y-3">
  {#if play.status === "ready" && play.playing}
    <Player
      playing={play.playing}
      {target}
      {title}
      onclose={() => play.close()}
      onnext={(episode) => void play.open(episode)}
    />
  {:else}
    <div class="flex flex-wrap items-center gap-3">
      <Button onclick={() => void play.open()} disabled={play.status === "loading"}>
        <Play aria-hidden="true" />
        {play.status === "loading" ? "Finding a source" : label}
      </Button>
      {#if account}<MediaServerSignIn {account} />{/if}
    </div>
    {#if play.status === "error" && play.error}
      <p class="text-sm text-muted-foreground" role="alert">{play.error.message}</p>
    {/if}
  {/if}
</section>
