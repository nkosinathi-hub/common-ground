import type { Scheme } from "@/shared/domain/design/tokens"
import { paletteFor } from "../domain/palette"
import type { SpaceLook } from "../domain/space-look"

/** The root attributes the generated CSS keys its modes and background styles on. */
const ATTRIBUTES = ["density", "radius", "background"] as const

/**
 * Applies a space's look to the root element and the browser bar colour: the palette as inline
 * variables, density, corners and background style as data attributes, the heading font and
 * the background picture. Returns the undo, which removes exactly what it set, so leaving the
 * space restores the design defaults everywhere else.
 */
export function applySpaceLook(
  root: HTMLElement,
  look: SpaceLook,
  scheme: Scheme,
  backgroundUrl: string | null = null,
) {
  const vars: Record<string, string> = {
    ...paletteFor(look, scheme).vars,
    "--heading-font": look.headings === "sans" ? "var(--font-sans)" : "var(--font-serif)",
    "--background-focus": `${look.focusX}% ${look.focusY}%`,
  }
  if (backgroundUrl) vars["--background-image"] = `url("${encodeURI(backgroundUrl)}")`
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
  const style = look.backgroundStyle === "image" && !backgroundUrl ? "solid" : look.backgroundStyle
  Object.assign(root.dataset, { density: look.density, radius: look.corners, background: style })
  const meta = document.querySelector('meta[name="theme-color"]')
  const before = meta?.getAttribute("content") ?? null
  const primary = getComputedStyle(root).getPropertyValue("--primary").trim()
  if (meta && primary) meta.setAttribute("content", primary)
  return () => {
    for (const name of Object.keys(vars)) root.style.removeProperty(name)
    for (const name of ATTRIBUTES) delete root.dataset[name]
    if (meta && before !== null) meta.setAttribute("content", before)
  }
}
