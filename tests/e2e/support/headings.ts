import type { Page } from "@playwright/test"

/** Outline rules: exactly one h1, it comes first, and levels never skip on the way down. */
export function headingProblems(levels: readonly number[]): string[] {
  const problems: string[] = []
  const h1s = levels.filter((level) => level === 1).length
  if (h1s !== 1) problems.push(`expected exactly one h1, found ${h1s}`)
  if (levels.length > 0 && levels[0] !== 1)
    problems.push(`first heading is h${levels[0]}, expected h1`)
  levels.forEach((level, i) => {
    const previous = levels[i - 1]
    if (previous !== undefined && level > previous + 1)
      problems.push(`h${level} follows h${previous} (skips a level)`)
  })
  return problems
}

/** Levels of the visible headings on the page, in document order. */
export async function headingLevels(page: Page): Promise<number[]> {
  return page
    .locator("h1, h2, h3, h4, h5, h6, [role=heading]")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => (node as HTMLElement).offsetParent !== null)
        .map((node) => Number(node.getAttribute("aria-level") ?? node.tagName.slice(1))),
    )
}
