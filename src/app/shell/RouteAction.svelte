<script lang="ts">
  import { onDestroy } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { RevealContent, type PageActionSpec } from "@/shared/ui"
  import { FanGesture } from "./fan-gesture"
  let {
    action,
    open,
    controls,
    trigger = $bindable(null),
    onReveal,
    onHover,
    onActivate,
  }: {
    action: PageActionSpec
    open: boolean
    controls: string
    trigger?: HTMLButtonElement | null
    onReveal: () => void
    onHover: () => void
    onActivate: () => void
  } = $props()
  let pointer = false,
    skipClick = false
  const gesture = new FanGesture(() => onReveal())
  onDestroy(() => gesture.cancel())
</script>

<Button
  bind:ref={trigger}
  variant="ghost"
  size="icon"
  class="reveal-trigger fan-trigger"
  aria-label={action.label}
  aria-expanded={open}
  aria-controls={controls}
  aria-describedby={`${controls}-hint`}
  aria-disabled={action.disabled || undefined}
  onpointerenter={(event) => {
    if (event.pointerType === "mouse") onHover()
  }}
  onfocus={(event) => {
    if (!pointer && event.currentTarget.matches(":focus-visible")) onReveal()
  }}
  onpointerdown={(event) => {
    pointer = true
    skipClick = false
    gesture.down(event)
  }}
  onpointermove={(event) => gesture.move(event)}
  onpointerup={(event) => {
    pointer = false
    if (event.pointerType === "mouse") {
      gesture.cancel()
      return
    }
    skipClick = true
    if (gesture.finish(event) && !action.disabled) {
      onActivate()
      action.onclick()
    }
  }}
  onpointercancel={() => {
    pointer = false
    gesture.cancel()
  }}
  oncontextmenu={(event) => {
    event.preventDefault()
    gesture.show()
  }}
  onclick={(event) => {
    if (event.detail !== 0 && (skipClick || gesture.consume())) {
      skipClick = false
      return
    }
    if (!action.disabled) {
      onActivate()
      action.onclick()
    }
  }}
>
  <RevealContent icon={action.icon} label={action.label} compact />
</Button>
<span id={`${controls}-hint`} class="sr-only"
  >Activate for {action.label}. Hover, hold or swipe up for navigation. Keyboard: arrow keys for
  routes, Escape to close. Navigation is also in More.</span
>
