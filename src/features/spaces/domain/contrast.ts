import { fromHsl, normaliseHex, parseHex, toHex, toHsl } from "./color"

const AA = 4.5
const STEP = 0.01

const linear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a hex colour. */
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex)!
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/**
 * The colour nearest `hex` that reads at 4.5:1 on every colour `against` returns for it: its
 * lightness steps darker or lighter until it does. Black and white always do, so it ends.
 */
export function nudgeToContrast(
  hex: string,
  against: (candidate: string) => readonly string[],
  direction: "darker" | "lighter",
): string {
  const start = toHsl(parseHex(hex)!)
  const step = direction === "darker" ? -STEP : STEP
  const passes = (candidate: string) =>
    against(candidate).every((c) => contrastRatio(candidate, c) >= AA)
  let candidate = normaliseHex(hex)!
  for (let l = start.l; !passes(candidate) && l >= 0 && l <= 1; l += step)
    candidate = toHex(fromHsl({ ...start, l: Math.min(1, Math.max(0, l)) }))
  return passes(candidate) ? candidate : direction === "darker" ? "#000000" : "#ffffff"
}
