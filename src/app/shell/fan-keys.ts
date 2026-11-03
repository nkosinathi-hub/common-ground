export const FAN_POSITIONS = [
  [-1, -0.24],
  [-0.71, -0.95],
  [0, -1.24],
  [0.71, -0.95],
  [1, -0.24],
]

/** This is a disclosure of ordinary links, with optional arrows in visual route order. */
export function fanKeys(
  event: KeyboardEvent,
  root: HTMLElement | undefined,
  open: boolean,
  expand: () => void,
  close: () => void,
) {
  if (event.key === "Escape" && open) {
    event.preventDefault()
    event.stopPropagation()
    close()
    return
  }
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
  if (!keys.includes(event.key) || !root) return
  event.preventDefault()
  expand()
  requestAnimationFrame(() => {
    const links = [...root.querySelectorAll<HTMLAnchorElement>(".fan-route")]
    const current = links.indexOf(document.activeElement as HTMLAnchorElement)
    const backwards = event.key === "ArrowLeft" || event.key === "ArrowUp"
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? links.length - 1
          : current < 0
            ? backwards
              ? links.length - 1
              : 0
            : (current + (backwards ? -1 : 1) + links.length) % links.length
    links[index]?.focus()
  })
}
