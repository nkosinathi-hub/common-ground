import { existsSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/**
 * Reuses a Chromium already on the machine instead of downloading one: CHROMIUM_PATH if set,
 * else the newest headless shell in the Playwright cache. Undefined lets Playwright decide (CI).
 */
export function localChromium(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  if (process.env.CI) return undefined
  const cache = join(homedir(), ".cache", "ms-playwright")
  if (!existsSync(cache)) return undefined
  const shells = readdirSync(cache)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
  for (const dir of shells) {
    const binary = join(cache, dir, "chrome-headless-shell-linux64", "chrome-headless-shell")
    if (existsSync(binary)) return binary
  }
  return undefined
}
