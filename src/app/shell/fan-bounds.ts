/** Track the hover corridor without putting an invisible click target over page content. */
export function fanContains(root: HTMLElement | undefined, event: PointerEvent): boolean {
  if (!root) return false
  const box = root.getBoundingClientRect()
  return (
    event.clientX >= box.left &&
    event.clientX <= box.right &&
    event.clientY >= box.top &&
    event.clientY <= box.bottom
  )
}
