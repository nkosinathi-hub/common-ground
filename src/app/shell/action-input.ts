import type { PageActionSpec } from "@/shared/ui"
import { FanGesture } from "./fan-gesture"
import { FanDrag } from "./fan-drag"

interface Control {
  action: () => PageActionSpec
  open: () => boolean
  touch: () => boolean
  reveal: () => void
  activate: () => void
  holdReveal?: () => void
  select?: (label: string | null) => void
  dragging?: (active: boolean) => void
}

/** Touch first discloses destinations; a second tap on the same control runs its page action. */
export class ActionInput {
  private pointer = false
  private skipClick = false
  private gesture: FanGesture
  private drag: FanDrag
  private anchor: HTMLElement | null = null
  private id: number | null = null
  private wasOpen = false
  constructor(private readonly control: Control) {
    this.drag = new FanDrag(() => this.anchor, { select: control.select, active: control.dragging })
    this.gesture = new FanGesture(() => {
      if (!this.wasOpen && control.holdReveal) control.holdReveal()
      else control.reveal()
      this.drag.begin()
    })
  }
  private run(touch: boolean) {
    if (touch && !this.control.open()) return this.control.reveal()
    const action = this.control.action()
    if (action.disabled) return
    this.control.activate()
    action.onclick()
  }
  focus = (event: FocusEvent) => {
    if (!this.pointer && (event.currentTarget as HTMLElement).matches(":focus-visible"))
      this.control.reveal()
  }
  down = (event: PointerEvent) => {
    if (!event.isPrimary && event.pointerType !== "mouse") return
    // Compatibility mouse focus must not steal focus back after a touch opens search or a dialog.
    if (event.pointerType !== "mouse") event.preventDefault()
    this.pointer = true
    this.id = event.pointerId
    this.anchor = event.currentTarget as HTMLElement
    this.wasOpen = this.control.open()
    this.skipClick = false
    this.drag.start(event)
    this.gesture.down(event)
  }
  move = (event: PointerEvent) => {
    if (event.pointerId !== this.id) return
    if (this.gesture.move(event)) this.drag.move(event)
    else this.drag.cancel()
  }
  up = (event: PointerEvent) => {
    if (event.pointerId !== this.id) return
    this.pointer = false
    this.id = null
    if (event.pointerType === "mouse") return this.cancel()
    this.skipClick = true
    const consumed = this.drag.finish(event)
    if (this.gesture.finish(event) && !consumed) this.run(true)
  }
  cancel = (event?: PointerEvent) => {
    if (event && this.id !== null && event.pointerId !== this.id) return
    if (this.pointer) this.skipClick = true
    this.pointer = false
    this.id = null
    this.gesture.cancel()
    this.drag.cancel()
  }
  context = (event: MouseEvent) => {
    event.preventDefault()
    this.gesture.show()
  }
  click = (event: MouseEvent) => {
    if (event.detail !== 0 && (this.skipClick || this.gesture.consume())) {
      this.skipClick = false
      return
    }
    this.run(this.control.touch())
  }
}
