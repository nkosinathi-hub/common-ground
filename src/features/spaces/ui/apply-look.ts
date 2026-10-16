import { ACCENT_VARS, type ColourMode } from "../domain/contrast"
import { lookOf, type SpaceProfile } from "../domain/look"
import type { Space } from "../domain/space"

type LookSource = Pick<SpaceProfile, "theme" | "accent"> & Pick<Space, "template">

/**
 * Applies a space's preset and custom accent to the root element and the browser bar colour.
 * Returns the undo, so leaving the space shell restores the neutral palette everywhere else.
 */
export function applySpaceLook(root: HTMLElement, space: LookSource, mode: ColourMode) {
  const look = lookOf(space, mode)
  root.dataset.spaceTheme = look.preset
  for (const [name, value] of Object.entries(look.vars)) root.style.setProperty(name, value)
  const meta = document.querySelector('meta[name="theme-color"]')
  const before = meta?.getAttribute("content") ?? null
  const primary = getComputedStyle(root).getPropertyValue("--primary").trim()
  if (meta && primary) meta.setAttribute("content", primary)
  return () => {
    delete root.dataset.spaceTheme
    for (const name of ACCENT_VARS) root.style.removeProperty(name)
    if (meta && before !== null) meta.setAttribute("content", before)
  }
}
