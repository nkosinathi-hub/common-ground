<script lang="ts">
  import { Captions, CaptionsOff, Maximize2, Minimize2, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { NextUp } from "../application/ports"
  import type { PlayableSource, Segment } from "../domain/source.types"
  import type { CaptionChoice } from "./caption-pref"
  import NextUpCountdown from "./NextUpCountdown.svelte"
  import SkipButton from "./SkipButton.svelte"

  interface Props {
    segments: readonly Segment[]
    autoIntro: boolean
    autoNext: boolean
    source: PlayableSource | null
    time: number
    next: NextUp | null
    captions: CaptionChoice
    theatre: boolean
    due: boolean
    onskip: (to: number) => void
    onnext: (next: NextUp) => void
    oncaptions: () => void
    ontheatre?: () => void
    onclose: () => void
  }

  let props: Props = $props()
  const hasText = $derived((props.source?.subtitles.length ?? 0) > 0)
</script>

<!-- Overlay controls live in the page, so theatre mode keeps them visible (iOS fullscreen hides them). -->
<div class="flex flex-wrap items-center gap-related">
  <SkipButton
    segments={props.segments}
    time={props.time}
    auto={props.autoIntro}
    onskip={props.onskip}
  />
  {#if props.next}
    <NextUpCountdown
      next={props.next}
      due={props.due}
      auto={props.autoNext}
      onplay={props.onnext}
    />
  {/if}
  <div class="ml-auto flex gap-1">
    {#if hasText}
      <Button
        size="icon"
        variant="ghost"
        aria-label={props.captions.on ? "Turn captions off" : "Turn captions on"}
        aria-pressed={props.captions.on}
        onclick={props.oncaptions}
      >
        {#if props.captions.on}<Captions aria-hidden="true" />{:else}<CaptionsOff
            aria-hidden="true"
          />{/if}
      </Button>
    {/if}
    {#if props.ontheatre}
      <Button
        size="icon"
        variant="ghost"
        aria-label={props.theatre ? "Leave theatre mode" : "Theatre mode"}
        aria-pressed={props.theatre}
        onclick={props.ontheatre}
      >
        {#if props.theatre}<Minimize2 aria-hidden="true" />{:else}<Maximize2
            aria-hidden="true"
          />{/if}
      </Button>
    {/if}
    <Button size="icon" variant="ghost" aria-label="Close the player" onclick={props.onclose}>
      <X aria-hidden="true" />
    </Button>
  </div>
</div>
