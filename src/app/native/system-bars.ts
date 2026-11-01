import { registerPlugin } from "@capacitor/core"

export interface BarColors {
  readonly top: string
  readonly bottom: string
}

/** android/.../SystemChromePlugin.java: paints the strips Capacitor leaves around the page. */
const SystemChrome = registerPlugin<{ setColors(colors: BarColors): Promise<void> }>("SystemChrome")

export function toHex(rgb: readonly number[]): string {
  return `#${rgb
    .slice(0, 3)
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`
}

/** A CSS colour in any notation (oklch included) as #rrggbb, by painting one pixel. */
function hexOf(css: string, pixel: CanvasRenderingContext2D): string {
  pixel.clearRect(0, 0, 1, 1)
  pixel.fillStyle = "#fff"
  pixel.fillRect(0, 0, 1, 1)
  pixel.fillStyle = css
  pixel.fillRect(0, 0, 1, 1)
  return toHex([...pixel.getImageData(0, 0, 1, 1).data])
}

/** The page's background behind the status bar; the tab bar, when shown, above the gesture bar. */
function readColors(pixel: CanvasRenderingContext2D): BarColors {
  const page = getComputedStyle(document.body).backgroundColor
  // The desktop rail shares the name and is hidden on phones; the shown one is the tab bar.
  const tabs = [...document.querySelectorAll<HTMLElement>('nav[aria-label="Main"]')].find(
    (nav) => nav.getClientRects().length > 0,
  )
  const bottom = tabs ? getComputedStyle(tabs).backgroundColor : page
  return { top: hexOf(page, pixel), bottom: hexOf(bottom, pixel) }
}

/** Calls `send` with the current colours whenever they differ from the last ones sent. */
export function barSync(read: () => BarColors, send: (colors: BarColors) => void): () => void {
  let last = ""
  return () => {
    const colors = read()
    const key = `${colors.top}${colors.bottom}`
    if (key !== last) send(colors)
    last = key
  }
}

/**
 * WebViews before 140 cannot report safe areas, so Capacitor pads the window and the status and
 * gesture bar strips show the plain window. They follow the app's colours instead: on theme,
 * look and route changes. Newer WebViews draw edge to edge and the strips never show.
 */
export function startSystemBars(): void {
  const pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!pixel) return
  const sync = barSync(
    () => readColors(pixel),
    (colors) => void SystemChrome.setColors(colors).catch(() => {}),
  )
  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => ((queued = false), sync()))
  }
  new MutationObserver(schedule).observe(document.documentElement, {
    attributes: true,
    subtree: true,
    childList: true,
    attributeFilter: ["class", "style", "data-theme", "data-density", "data-radius"],
  })
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", schedule)
  schedule()
}
