import type { FigmaExport } from "../../src/shared/domain/design/tokens"

const WEIGHTS: Readonly<Record<string, number>> = {
  Regular: 400,
  Medium: 500,
  "Semi Bold": 600,
  Bold: 700,
}

/** `heading/h1` is `h1`, `body/default` is `body`, `label/sm` is `label-sm`. */
export const styleName = (name: string) =>
  name
    .replace(/^heading\//, "")
    .replace(/\/default$/, "")
    .replace(/^body\//, "")
    .replace("/", "-")

export const isHeading = (name: string) => /^(display|heading\/)/.test(name)

/** One `type-<style>` utility per Figma text style: family, size, line height, weight, tracking. */
export function typeUtilities(source: FigmaExport): string {
  return source.text
    .map((t) => {
      const name = styleName(t.name)
      const family = isHeading(t.name) ? "var(--font-heading)" : "var(--font-sans)"
      return [
        `@utility type-${name} {`,
        `  font-family: ${family};`,
        `  font-size: var(--text-${name});`,
        `  line-height: var(--text-${name}--line-height);`,
        `  font-weight: ${WEIGHTS[t.style] ?? 400};`,
        `  letter-spacing: ${t.tracking};`,
        "}",
      ].join("\n")
    })
    .join("\n\n")
}
