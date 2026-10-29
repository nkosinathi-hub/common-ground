import exported from "./figma-export.json"

/**
 * The design file's variables and styles, exported from Figma (scripts/design/figma-export.ts).
 * Every visual value in the app comes from here: the CSS in src/styles/generated is written
 * from it, and contrast checks read it. Refresh with `pnpm design:tokens --from-figma <file>`.
 */
export type TokenValue = number | string | { readonly alias: string }
export interface FigmaCollection {
  readonly name: string
  readonly modes: readonly string[]
  readonly variables: readonly { readonly name: string; readonly values: readonly TokenValue[] }[]
}
export interface FigmaTextStyle {
  readonly name: string
  readonly family: string
  readonly style: string
  readonly size: number
  readonly lineHeight: number
  readonly tracking: string
}
export interface FigmaShadow {
  readonly x: number
  readonly y: number
  readonly blur: number
  readonly spread: number
  readonly color: string
}
export interface FigmaExport {
  readonly collections: readonly FigmaCollection[]
  readonly text: readonly FigmaTextStyle[]
  readonly effects: readonly { readonly name: string; readonly shadows: readonly FigmaShadow[] }[]
}

export const FIGMA: FigmaExport = exported

export function collection(name: string, source: FigmaExport = FIGMA): FigmaCollection {
  const found = source.collections.find((c) => c.name === name)
  if (!found) throw new Error(`Figma export has no "${name}" collection`)
  return found
}

/** The mode names of a collection, lowercased: the values of data-density, data-radius. */
export const modesOf = (name: string): string[] =>
  collection(name).modes.map((mode) => mode.toLowerCase())

export type Scheme = "light" | "dark"

/** One colour per scheme, aliases followed: the values contrast checks compare. */
export function palette(scheme: Scheme, source: FigmaExport = FIGMA): Record<string, string> {
  const colours = collection("Color", source)
  const index = colours.modes.findIndex((mode) => mode.toLowerCase() === scheme)
  const raw = new Map(colours.variables.map((v) => [v.name, v.values[index]]))
  const resolve = (value: TokenValue | undefined, seen: number): string => {
    if (typeof value === "string") return value
    if (typeof value === "object" && seen < raw.size) return resolve(raw.get(value.alias), seen + 1)
    throw new Error(`Colour token is not a colour: ${JSON.stringify(value)}`)
  }
  return Object.fromEntries(
    colours.variables.map((v) => [v.name.replace(/^color\//, ""), resolve(v.values[index], 0)]),
  )
}
