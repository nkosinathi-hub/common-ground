<script lang="ts">
  import type { Hsv } from "../../domain/color"

  /** Saturation by value at one hue, dragged with a pointer; the hue slider and hex field are the keyboard way. */
  let { hsv = $bindable() }: { hsv: Hsv } = $props()

  function drag(event: PointerEvent) {
    if (event.buttons !== 1 && event.type !== "pointerdown") return
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const clamp = (n: number) => Math.min(1, Math.max(0, n))
    const s = clamp((event.clientX - box.left) / box.width)
    hsv = { ...hsv, s, v: clamp(1 - (event.clientY - box.top) / box.height) }
  }
</script>

<div
  aria-hidden="true"
  class="relative h-36 cursor-crosshair touch-none rounded-md"
  style:background="linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl({hsv.h}
  100% 50%))"
  onpointerdown={drag}
  onpointermove={drag}
>
  <span
    class="absolute size-3 -translate-1/2 rounded-full border-2 border-white shadow-xs"
    style:left="{hsv.s * 100}%"
    style:top="{(1 - hsv.v) * 100}%"
  ></span>
</div>
<input
  type="range"
  min="0"
  max="359"
  aria-label="Hue"
  value={Math.round(hsv.h)}
  oninput={(event) => (hsv = { ...hsv, h: Number(event.currentTarget.value) })}
  class="h-3 w-full cursor-pointer appearance-none rounded-full"
  style:background="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
/>
