<script lang="ts">
  import { onDestroy } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { ChevronUp, Compass } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { RevealContent, type PageActionSpec } from "@/shared/ui"
  import { ActionInput } from "./action-input"
  let {
    action,
    open,
    controls,
    contextual = false,
    trigger = $bindable(null),
    onReveal,
    onHover,
    onActivate,
    onHold,
  }: {
    action: PageActionSpec
    open: boolean
    controls: string
    contextual?: boolean
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
    touch: () => touch.current,
    reveal: () => onReveal(),
    activate: () => onActivate(),
    holdReveal: () => onHold(),
    select: (label) => (selected = label),
    dragging: (active) => (dragging = active),
  })
  onDestroy(input.cancel)
  const revealLabel = $derived(contextual ? "Title actions" : "Navigate")
  const label = $derived(
    touch.current && !open ? (contextual ? "Open title actions" : "Open navigation") : action.label,
  )
</script>

<svelte:window onblur={() => input.cancel()} />

<Button
  bind:ref={trigger}
  variant="ghost"
  size="icon"
  class="reveal-trigger fan-trigger"
  aria-label={label}
  aria-expanded={open}
  aria-controls={controls}
  aria-describedby={`${controls}-hint`}
  aria-disabled={((open || !touch.current) && action.disabled) || undefined}
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
  <RevealContent
    icon={touch.current && !open ? Compass : action.icon}
    label={action.label}
    compact
  />
  <ChevronUp class="action-chevron" aria-hidden="true" />
  <span class="touch-action-label" aria-hidden="true"
    >{dragging
      ? selected
        ? `Release for ${selected}`
        : "Drag to choose"
      : open
        ? action.label
        : revealLabel}</span
  >
</Button>
<span id={`${controls}-hint`} class="sr-only">
  Touch: tap to reveal {contextual ? "title actions" : "routes"}, then use the centre for {action.label}.
  Mouse: hover for actions, click for {action.label}. Arrow keys navigate; Escape closes. All tools
  are in the Common Ground logo. Hold or slide up, drag to a destination, then release to select it.
</span>
