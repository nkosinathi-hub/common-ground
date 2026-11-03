/** A normal tap keeps the page action; hold or swipe up reveals destinations instead. */
export class FanGesture {
  private timer: ReturnType<typeof setTimeout> | undefined
  private start = { x: 0, y: 0 }
  private handled = false
  private tracking = false
  constructor(private readonly reveal: () => void) {}
  down(event: PointerEvent) {
    this.cancel()
    this.handled = false
    if (event.pointerType === "mouse" || !event.isPrimary) return
    this.tracking = true
    this.start = { x: event.clientX, y: event.clientY }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    this.timer = setTimeout(() => this.show(), 450)
  }
  move(event: PointerEvent) {
    if (!this.timer) return
    if (event.clientY - this.start.y < -24) this.show()
    else if (Math.abs(event.clientX - this.start.x) > 16 || event.clientY - this.start.y > 16)
      this.cancel()
  }
  show() {
    this.cancel()
    this.handled = true
    this.reveal()
  }
  finish(event: PointerEvent): boolean {
    const tap = this.tracking && !this.handled
    this.cancel()
    this.handled = false
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    return (
      tap &&
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom
    )
  }
  cancel() {
    this.tracking = false
    clearTimeout(this.timer)
    this.timer = undefined
  }
  consume() {
    const handled = this.handled
    this.handled = false
    return handled
  }
}
