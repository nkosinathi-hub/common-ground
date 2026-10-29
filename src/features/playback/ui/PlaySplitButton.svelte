<script lang="ts">
  import { ChevronDown, Play } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Popover from "$lib/components/ui/popover"
  import { cn } from "$lib/utils"
  import type { EpisodeNumber } from "../application/ports"
  import EpisodePicker from "./EpisodePicker.svelte"
  import { useTitlePlayback } from "./title-playback.svelte"

  /** Full width in the phone's sticky bar; fits its label in the header. */
  let { block = false }: { block?: boolean } = $props()
  const playback = useTitlePlayback()
  let picking = $state(false)
  const next = $derived(playback?.next)
  const label = $derived.by(() => {
    if (!playback?.episodic) return "Play"
    if (!next) return "Play"
    const name = playback.nextName
    return `S${next.season} E${next.episode}${name ? ` · ${name}` : ""}`
  })

  function pick(episode: EpisodeNumber) {
    picking = false
    void playback?.playEpisode(episode)
  }
</script>

<!-- Play split button (287:9587): the next episode from your place; the chevron picks another. -->
{#if playback}
  <div class={cn("flex", block && "min-w-0 flex-1")}>
    <Button
      class={cn("min-w-0 rounded-r-none", block && "flex-1")}
      disabled={playback.play.status === "loading"}
      onclick={() => void playback.playNext()}
    >
      <Play aria-hidden="true" /><span class="truncate">{label}</span>
    </Button>
    {#if playback.episodic}
      <Popover.Root bind:open={picking}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              size="icon"
              class="rounded-l-none border-l border-primary-foreground/30"
              aria-label="Play an episode"
            >
              <ChevronDown />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="start" class="w-80">
          <EpisodePicker
            {playback}
            onpick={pick}
            onseason={(season) => void playback.choices.selectSeason(playback.target(), season)}
          />
        </Popover.Content>
      </Popover.Root>
    {/if}
  </div>
{/if}
