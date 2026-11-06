<script lang="ts">
  import { onDestroy } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { ChevronUp } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { RevealContent, type PageActionSpec } from "@/shared/ui"
  import { ActionInput } from "./action-input"
  let {
    action,
    open,
    controls,
    trigger = $bindable(null),
    onReveal,
    onHover,
    onActivate,
    onHold,
  }: {
    action: PageActionSpec
    open: boolean
    controls: string
    trigger?: HTMLButtonElement | null
    onReveal: () => void
    onHover: () => void
    onActivate: () => void
    onHold: () => void
  } = $props()
  const touch = new MediaQuery("(pointer: coarse)")
  let dragging = $state(false),
    selected = $state<string | null>(null)
  const input = new ActionInput({
    action: () => action,
    open: () => open,
    reveal: () => onReveal(),
    activate: () => onActivate(),
    holdReveal: () => onHold(),
    select: (label) => (selected = label),
    dragging: (active) => (dragging = active),
  })
  onDestroy(input.cancel)
  const label = $derived(action.label)
</script>

<svelte:window
  onblur={() => input.cancel()}
  onpointerdowncapture={input.outsideDown}
  onclickcapture={input.compatibilityClick}
/>

<Button
  bind:ref={trigger}
  variant="ghost"
  size="icon"
  class="reveal-trigger fan-trigger"
  aria-label={label}
  aria-expanded={open}
  aria-controls={controls}
  aria-describedby={`${controls}-hint`}
  aria-disabled={action.disabled || undefined}
  onpointerenter={(event) => {
    if (event.pointerType === "mouse" && !touch.current) onHover()
  }}
  onfocus={input.focus}
  onpointerdown={input.down}
  onpointermove={input.move}
  onpointerup={input.up}
  onpointercancel={input.cancel}
  onlostpointercapture={input.cancel}
  oncontextmenu={input.context}
  onclick={input.click}
>
  <RevealContent icon={action.icon} label={action.label} compact />
  <ChevronUp class="action-chevron" aria-hidden="true" />
  <span class="touch-action-label" aria-hidden="true"
    >{dragging
      ? selected
        ? `Release for ${selected}`
        : "Drag to choose"
      : open
        ? action.label
        : action.label}</span
  >
</Button>
<span id={`${controls}-hint`} class="sr-only">
  Tap for {action.label}. Hold for navigation. Mouse: hover for actions, click for {action.label}.
  Arrow keys navigate; Escape closes. All tools are in the Common Ground logo. Hold or slide up,
  drag to a destination, then release to select it.
</span>
