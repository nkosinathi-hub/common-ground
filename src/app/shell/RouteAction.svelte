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
  const touch = new MediaQuery("(pointer: coarse)")
  const input = new ActionInput({
    action: () => action,
    open: () => open,
    touch: () => touch.current,
    reveal: () => onReveal(),
    activate: () => onActivate(),
  })
  onDestroy(input.cancel)
  const label = $derived(touch.current && !open ? "Open navigation" : action.label)
</script>

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
  oncontextmenu={input.context}
  onclick={input.click}
>
  <RevealContent
    icon={touch.current && !open ? Compass : action.icon}
    label={action.label}
    compact
  />
  <ChevronUp class="action-chevron" aria-hidden="true" />
  <span class="touch-action-label" aria-hidden="true">{open ? action.label : "Navigate"}</span>
</Button>
<span id={`${controls}-hint`} class="sr-only">
  Touch: tap to reveal routes, then use the centre for {action.label}. Mouse: hover for routes,
  click for {action.label}. Arrow keys navigate; Escape closes. All tools are in the Common Ground
  logo.
</span>
