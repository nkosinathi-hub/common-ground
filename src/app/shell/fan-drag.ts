import { fanHit, type HitTest } from "./fan-hit"

interface Feedback {
  select?: (label: string | null) => void
  active?: (active: boolean) => void
}

/** Pointer capture keeps the gesture alive; physical hit testing selects the item below it. */
export class FanDrag {
  private trigger: HTMLElement | null = null
  private root: HTMLElement | null = null
  private selected: HTMLElement | null = null
  private pointer: number | null = null
  private point = { x: 0, y: 0 }
  private dragging = false
  private frame = 0
  constructor(
    private readonly anchor: () => HTMLElement | null,
    private readonly feedback: Feedback,
    private readonly hitTest: HitTest = (x, y) => document.elementFromPoint(x, y),
  ) {}
  start(event: PointerEvent) {
    this.cancel()
    if (event.pointerType === "mouse") return
    this.pointer = event.pointerId
    this.point = { x: event.clientX, y: event.clientY }
    this.trigger = this.anchor()
    this.trigger?.setAttribute("data-holding", "")
  }
  begin() {
    if (this.pointer === null) return
    this.root = this.trigger?.closest<HTMLElement>("nav") ?? null
    this.trigger?.removeAttribute("data-holding")
    this.root?.setAttribute("data-dragging", "")
    this.dragging = true
    this.feedback.active?.(true)
    this.tick()
  }
  move(event: PointerEvent) {
    if (event.pointerId !== this.pointer) return
    this.point = { x: event.clientX, y: event.clientY }
    if (this.dragging) this.update()
  }
  finish(event: PointerEvent): boolean {
    if (event.pointerId !== this.pointer) return false
    this.move(event)
    const consumed = this.dragging,
      target = this.selected
    this.cancel()
    if (consumed && target?.isConnected) target.click()
    return consumed
  }
  cancel() {
    cancelAnimationFrame(this.frame)
    this.selected?.removeAttribute("data-drag-selected")
    if (this.selected) this.feedback.select?.(null)
    this.trigger?.removeAttribute("data-holding")
    this.root?.removeAttribute("data-dragging")
    if (this.dragging) this.feedback.active?.(false)
    this.dragging = false
    this.pointer = this.root = this.selected = this.trigger = null
  }
  private tick = () => {
    if (!this.dragging) return
    this.update()
    this.frame = requestAnimationFrame(this.tick)
  }
  private update() {
    const next = this.root ? fanHit(this.root, this.point, this.hitTest) : null
    if (next === this.selected) return
    this.selected?.removeAttribute("data-drag-selected")
    this.selected = next
    next?.setAttribute("data-drag-selected", "")
    this.feedback.select?.(next?.getAttribute("aria-label") ?? null)
  }
}
