import { collection, type FigmaExport } from "../../src/shared/domain/design/tokens"
import { isHeading, styleName, typeUtilities } from "./css-type"
import { rawName } from "./css-vars"

/** Tailwind's view of the tokens: `@theme inline` names, so `p-card` reads `var(--space-card)`. */

/** Self-hosted font stacks (@fontsource-variable), keyed by the Figma family. */
const FONT_STACKS: Readonly<Record<string, string>> = {
  Inter: '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  Lora: '"Lora Variable", ui-serif, Georgia, "Times New Roman", serif',
}

/**
 * shadcn names the Figma file does not draw, defined from the ones it does, so the vendored
 * primitives keep working. Derived, never a second palette.
 */
const DERIVED: readonly [string, string][] = [
  ["card-foreground", "var(--foreground)"],
  ["popover", "var(--card)"],
  ["popover-foreground", "var(--foreground)"],
  ["accent", "var(--muted)"],
  ["accent-foreground", "var(--foreground)"],
  ["input", "var(--border)"],
  ["sidebar-accent", "color-mix(in oklab, var(--sidebar-foreground) 14%, var(--sidebar))"],
  ["sidebar-accent-foreground", "var(--sidebar-foreground)"],
  ["sidebar-border", "color-mix(in oklab, var(--sidebar-foreground) 20%, var(--sidebar))"],
]

/** Tailwind namespaces per Layout group: `p-card`, `h-control-default`, `w-field-date`, `max-w-form`. */
const LAYOUT_KEYS: Readonly<Record<string, string>> = {
  spacing: "spacing-",
  control: "spacing-control-",
  field: "container-field-",
}

export function themeCss(source: FigmaExport): string {
  const theme: string[] = []
  for (const v of collection("Color", source).variables) {
    const name = v.name.slice("color/".length)
    theme.push(`--color-${name}: var(--${name});`)
  }
  for (const [name, value] of DERIVED) theme.push(`--color-${name}: ${value};`)
  for (const v of collection("Layout", source).variables) {
    const [group, name] = v.name.split("/") as [string, string]
    if (group === "spacing" && name.startsWith("gutter-")) continue
    const key = `${LAYOUT_KEYS[group] ?? "container-"}${name}`
    theme.push(`--${key}: var(${rawName(v.name)});`)
  }
  theme.push("--spacing-gutter: var(--gutter);")
  for (const v of collection("Radius", source).variables)
    if (v.name !== "radius/full")
      theme.push(`--radius-${v.name.slice(7)}: var(${rawName(v.name)});`)
  const heading = source.text.find((t) => isHeading(t.name))?.family ?? "Lora"
  const body = source.text.find((t) => !isHeading(t.name))?.family ?? "Inter"
  theme.push(`--font-sans: ${FONT_STACKS[body]};`, `--font-serif: ${FONT_STACKS[heading]};`)
  theme.push("--font-heading: var(--heading-font, var(--font-serif));")
  for (const t of source.text) {
    const key = `--text-${styleName(t.name)}`
    theme.push(`${key}: ${t.size}px;`, `${key}--line-height: ${t.lineHeight}px;`)
  }
  for (const e of source.effects) {
    const shadow = e.shadows.map((s) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
    theme.push(`--shadow-${e.name.split("/").at(-1)}: ${shadow.join(", ")};`)
  }
  return `@theme inline {\n${theme.map((l) => `  ${l}`).join("\n")}\n}\n\n${typeUtilities(source)}`
}
