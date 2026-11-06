import { keyAction } from "./player-logic"
import { applyKey } from "./track-playback"
export function playerKeyboard(event: KeyboardEvent, controls: Parameters<typeof applyKey>[1]) {
  const action = keyAction(event.key)
  if (
    !action ||
    /^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test((event.target as HTMLElement).tagName)
  )
    return
  event.preventDefault()
  applyKey(action, controls)
}
