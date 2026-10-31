import {
  collection,
  type FigmaCollection,
  type FigmaExport,
  type TokenValue,
} from "../../src/shared/domain/design/tokens"

/** CSS custom properties written from the Figma collections; the raw values utilities read. */

const block = (selector: string, lines: readonly string[]) =>
  lines.length ? `${selector} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}\n` : ""

function px(value: TokenValue | undefined): string {
  if (typeof value === "number") return `${value}px`
  if (typeof value === "string") return value
  throw new Error(`Expected a size or colour, got ${JSON.stringify(value)}`)
}

/**
 * `color/primary` becomes `--primary`, `spacing/card` `--space-card`, `radius/lg` `--corner-lg`,
 * `container/form` `--measure-form`: never a Tailwind theme name, so `@theme inline` can map them.
 */
const PREFIX: Readonly<Record<string, string>> = {
  color: "",
  spacing: "space-",
  radius: "corner-",
  container: "measure-",
}
export function rawName(variable: string): string {
  const [group, name] = variable.split("/") as [string, string]
  return `--${PREFIX[group] ?? `${group}-`}${name}`
}

const value = (v: TokenValue | undefined) =>
  typeof v === "object" ? `var(${rawName(v.alias)})` : px(v)

const GUTTER = /^spacing\/gutter-(\d+)$/

/** Values that differ from the first mode: what a mode's own selector must override. */
function changed(c: FigmaCollection, mode: number) {
  return c.variables.filter(
    (v) => JSON.stringify(v.values[mode]) !== JSON.stringify(v.values[0]) && !GUTTER.test(v.name),
  )
}

const declare = (c: FigmaCollection, mode: number, variables = c.variables) =>
  variables
    .filter((v) => !GUTTER.test(v.name) && v.name !== "radius/full")
    .map((v) => `${rawName(v.name)}: ${value(v.values[mode])};`)

/** The page gutter steps up at each width Figma names (`spacing/gutter-768`), mobile first. */
function gutter(layout: FigmaCollection): string {
  const steps = layout.variables
    .map((v) => ({ width: Number(GUTTER.exec(v.name)?.[1]), size: v.values[0] }))
    .filter((s) => s.width)
    .sort((a, b) => a.width - b.width)
  const [first, ...rest] = steps
  if (!first) return ""
  return [
    block(":root", [`--gutter: ${px(first.size)};`]),
    ...rest.map(
      (s) =>
        `@media (min-width: ${s.width}px) {\n${block(":root", [`--gutter: ${px(s.size)};`])}}\n`,
    ),
  ].join("")
}

/** Every mode after the first becomes `[data-<attribute>="<mode>"]`; Color's second is `.dark`. */
export function variablesCss(source: FigmaExport): string {
  const layout = collection("Layout", source)
  const radius = collection("Radius", source)
  const color = collection("Color", source)
  const modeBlocks = (c: FigmaCollection, attribute: string) =>
    c.modes
      .slice(1)
      .map((mode, i) =>
        block(`[data-${attribute}="${mode.toLowerCase()}"]`, declare(c, i + 1, changed(c, i + 1))),
      )
      .join("")
  return [
    block(":root", [...declare(color, 0), ...declare(layout, 0), ...declare(radius, 0)]),
    block(".dark", declare(color, 1, changed(color, 1))),
    modeBlocks(layout, "density"),
    modeBlocks(radius, "radius"),
    gutter(layout),
  ].join("\n")
}
