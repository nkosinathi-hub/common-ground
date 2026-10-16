import { existsSync, readdirSync } from "node:fs"
import { homedir } from "node:os"

type Env = Record<string, string | undefined>

interface DirReader {
  list(dir: string): string[]
  exists(path: string): boolean
}

/** Where Playwright keeps downloaded browsers on each platform. */
export function cacheDir(platform: string, env: Env, home: string): string {
  if (env.PLAYWRIGHT_BROWSERS_PATH) return env.PLAYWRIGHT_BROWSERS_PATH
  if (platform === "darwin") return `${home}/Library/Caches/ms-playwright`
  if (platform === "win32") return `${env.LOCALAPPDATA ?? `${home}/AppData/Local`}/ms-playwright`
  return `${home}/.cache/ms-playwright`
}

/** The headless shell binary inside one revision folder. */
export function shellBinary(platform: string, arch: string): string {
  if (platform === "win32") return "chrome-headless-shell-win64/chrome-headless-shell.exe"
  const folder = platform === "darwin" ? `mac-${arch === "arm64" ? "arm64" : "x64"}` : "linux64"
  return `chrome-headless-shell-${folder}/chrome-headless-shell`
}

const PREFIX = "chromium_headless_shell-"

/** The newest installed headless shell revision whose binary exists, if any. */
export function newestHeadlessShell(
  dir: string,
  platform: string,
  arch: string,
  fs: DirReader,
): string | undefined {
  const revision = (name: string) => Number(name.slice(PREFIX.length))
  return fs
    .list(dir)
    .filter((name) => name.startsWith(PREFIX) && Number.isFinite(revision(name)))
    .sort((a, b) => revision(b) - revision(a))
    .map((name) => `${dir}/${name}/${shellBinary(platform, arch)}`)
    .find((path) => fs.exists(path))
}

/**
 * Reuses a Chromium already on the machine instead of downloading one: CHROMIUM_PATH if set,
 * else the newest headless shell in the Playwright cache. Undefined lets Playwright decide (CI).
 */
export function localChromium(env: Env = process.env): string | undefined {
  if (env.CHROMIUM_PATH) return env.CHROMIUM_PATH
  if (env.CI) return undefined
  const dir = cacheDir(process.platform, env, homedir())
  const fs: DirReader = {
    list: (path) => (existsSync(path) ? readdirSync(path) : []),
    exists: existsSync,
  }
  return newestHeadlessShell(dir, process.platform, process.arch, fs)
}
