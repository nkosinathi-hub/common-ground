export type FanPoint = { x: number; y: number }
export type HitTest = (x: number, y: number) => Element | null

export function fanHit(root: HTMLElement, point: FanPoint, hitTest: HitTest): HTMLElement | null {
  const entry = hitTest(point.x, point.y)?.closest<HTMLElement>(".fan-route")
  return entry &&
    root.contains(entry) &&
    !entry.matches(":disabled, [aria-disabled=true]") &&
    !entry.closest("[inert]")
    ? entry
    : null
}
