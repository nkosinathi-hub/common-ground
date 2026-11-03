import type { PageActionSpec } from "@/shared/ui"
import { FanGesture } from "./fan-gesture"

interface Control {
  action: () => PageActionSpec
  open: () => boolean
  touch: () => boolean
  reveal: () => void
  activate: () => void
}

/** Touch first discloses destinations; a second tap on the same control runs its page action. */
export class ActionInput {
  private pointer = false
  private skipClick = false
  private gesture: FanGesture
  constructor(private readonly control: Control) {
    this.gesture = new FanGesture(control.reveal)
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
    // Compatibility mouse focus must not steal focus back after a touch opens search or a dialog.
    if (event.pointerType !== "mouse") event.preventDefault()
    this.pointer = true
    this.skipClick = false
    this.gesture.down(event)
  }
  move = (event: PointerEvent) => this.gesture.move(event)
  up = (event: PointerEvent) => {
    this.pointer = false
    if (event.pointerType === "mouse") return this.gesture.cancel()
    this.skipClick = true
    if (this.gesture.finish(event)) this.run(true)
  }
  cancel = () => {
    this.pointer = false
    this.gesture.cancel()
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
