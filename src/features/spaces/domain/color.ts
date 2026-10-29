/** Pure colour helpers for space accents: hex in and out, HSL, and mixing. */
export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

export interface Hsl {
  readonly h: number
  readonly s: number
  readonly l: number
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Reads #rrggbb or #rgb (hash optional, any case); anything else is null. */
export function parseHex(raw: string): Rgb | null {
  const match = HEX.exec(raw.trim())
  if (!match) return null
  const digits = match[1]!
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits
  const value = Number.parseInt(full, 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

const channel = (value: number) =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0")

export const toHex = ({ r, g, b }: Rgb) => `#${channel(r)}${channel(g)}${channel(b)}`

/** The lowercase #rrggbb form the database accepts, or null for input that is not a colour. */
export function normaliseHex(raw: string): string | null {
  const rgb = parseHex(raw)
  return rgb ? toHex(rgb) : null
}

export function toHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h =
    max === rn ? ((gn - bn) / d + 6) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

export function fromHsl({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const sector = Math.floor(h / 60) % 6
  const [r, g, b] = (
    [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ] as const
  )[sector]!
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

/** `weight` of `a` mixed into `b` (0 gives b, 1 gives a). */
export function mix(a: string, b: string, weight: number): string {
  const [x, y] = [parseHex(a)!, parseHex(b)!]
  const blend = (p: number, q: number) => p * weight + q * (1 - weight)
  return toHex({ r: blend(x.r, y.r), g: blend(x.g, y.g), b: blend(x.b, y.b) })
}

export interface Hsv {
  readonly h: number
  readonly s: number
  readonly v: number
}

/** Hue, saturation and value: the colour picker's area is saturation by value at one hue. */
export function toHsv({ r, g, b }: Rgb): Hsv {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const d = max - Math.min(rn, gn, bn)
  return { h: toHsl({ r, g, b }).h, s: max === 0 ? 0 : d / max, v: max }
}

export function fromHsv({ h, s, v }: Hsv): Rgb {
  const l = v * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
  return fromHsl({ h, s: sl, l })
}
