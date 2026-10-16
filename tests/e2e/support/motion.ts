import type { Page } from "@playwright/test"

/** Longest motion still allowed under reduced motion, in seconds (the app.css override). */
const MOTION_LIMIT_S = 0.01

/**
 * Motions longer than the limit: running Web Animations (Svelte transitions), and CSS animation
 * or transition durations computed on any element or pseudo-element.
 */
export function longMotions(page: Page): Promise<string[]> {
  return page.evaluate((limit) => {
    const seconds = (value: string) =>
      Math.max(
        ...value
          .split(",")
          .map((v) => (v.trim().endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v)) || 0),
      )
    const found: string[] = []
    for (const animation of document.getAnimations()) {
      const duration = Number(animation.effect?.getTiming().duration ?? 0)
      if (animation.playState === "running" && duration / 1000 > limit)
        found.push(
          `animation ${duration}ms on ${(animation.effect as KeyframeEffect)?.target?.nodeName}`,
        )
    }
    for (const node of document.querySelectorAll("*")) {
      for (const pseudo of [null, "::before", "::after"]) {
        const style = getComputedStyle(node, pseudo)
        for (const prop of ["transitionDuration", "animationDuration"] as const) {
          if (seconds(style[prop]) > limit)
            found.push(
              `${prop} ${style[prop]} on ${node.nodeName}.${node.className}${pseudo ?? ""}`,
            )
        }
      }
    }
    return found
  }, MOTION_LIMIT_S)
}

/** True when the page scrolls sideways. */
export const scrollsSideways = (page: Page) =>
  page.evaluate(() => {
    const root = document.scrollingElement!
    return root.scrollWidth > root.clientWidth
  })
