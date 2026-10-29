<script lang="ts">
  interface Props {
    picture: string
    x: number
    y: number
    onmove: (x: number, y: number) => void
  }

  let { picture, x, y, onmove }: Props = $props()
  const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))
  const KEYS: Record<string, [number, number]> = {
    ArrowLeft: [-5, 0],
    ArrowRight: [5, 0],
    ArrowUp: [0, -5],
    ArrowDown: [0, 5],
  }

  function drag(event: PointerEvent) {
    if (event.buttons !== 1 && event.type !== "pointerdown") return
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    onmove(
      clamp(((event.clientX - box.left) / box.width) * 100),
      clamp(((event.clientY - box.top) / box.height) * 100),
    )
  }
  function nudge(event: KeyboardEvent) {
    const step = KEYS[event.key]
    if (!step) return
    event.preventDefault()
    onmove(clamp(x + step[0]), clamp(y + step[1]))
  }
</script>

<!-- The picture with a dot on the part to keep in view: dragged, or moved with the arrow keys. -->
<div
  class="relative aspect-5/3 w-40 shrink-0 touch-none overflow-hidden rounded-sm"
  role="presentation"
  onpointerdown={drag}
  onpointermove={drag}
>
  <img src={picture} alt="" class="size-full object-cover" style:object-position="{x}% {y}%" />
  <button
    type="button"
    class="absolute size-4 -translate-1/2 rounded-full border-2 border-white bg-primary shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    style:left="{x}%"
    style:top="{y}%"
    aria-label="Focal point, {x}% across and {y}% down. Use the arrow keys to move it."
    onkeydown={nudge}
  ></button>
</div>
