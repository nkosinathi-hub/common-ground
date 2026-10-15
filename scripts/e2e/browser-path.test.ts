import { describe, expect, it } from "vitest"
import { cacheDir, newestHeadlessShell, shellBinary } from "../../tests/e2e/support/browser-path"

const fakeFs = (dirs: string[], files: string[]) => ({
  list: () => dirs,
  exists: (path: string) => files.includes(path),
})

describe("headless shell resolver", () => {
  it("finds the Playwright cache on each platform", () => {
    expect(cacheDir("linux", {}, "/h")).toBe("/h/.cache/ms-playwright")
    expect(cacheDir("darwin", {}, "/h")).toBe("/h/Library/Caches/ms-playwright")
    expect(cacheDir("win32", { LOCALAPPDATA: "C:/L" }, "/h")).toBe("C:/L/ms-playwright")
    expect(cacheDir("linux", { PLAYWRIGHT_BROWSERS_PATH: "/b" }, "/h")).toBe("/b")
  })

  it("knows the binary layout per platform", () => {
    expect(shellBinary("linux", "x64")).toBe("chrome-headless-shell-linux64/chrome-headless-shell")
    expect(shellBinary("darwin", "arm64")).toBe(
      "chrome-headless-shell-mac-arm64/chrome-headless-shell",
    )
    expect(shellBinary("win32", "x64")).toBe(
      "chrome-headless-shell-win64/chrome-headless-shell.exe",
    )
  })

  it("picks the newest revision by number, not by string order", () => {
    const bin = "chrome-headless-shell-linux64/chrome-headless-shell"
    const fs = fakeFs(
      ["chromium-1243", "chromium_headless_shell-999", "chromium_headless_shell-1243", "ffmpeg-1"],
      [`/c/chromium_headless_shell-999/${bin}`, `/c/chromium_headless_shell-1243/${bin}`],
    )
    expect(newestHeadlessShell("/c", "linux", "x64", fs)).toBe(
      `/c/chromium_headless_shell-1243/${bin}`,
    )
  })

  it("skips a revision whose binary is missing, and gives up when none exist", () => {
    const bin = "chrome-headless-shell-linux64/chrome-headless-shell"
    const dirs = ["chromium_headless_shell-1208", "chromium_headless_shell-1243"]
    const partial = fakeFs(dirs, [`/c/chromium_headless_shell-1208/${bin}`])
    expect(newestHeadlessShell("/c", "linux", "x64", partial)).toBe(
      `/c/chromium_headless_shell-1208/${bin}`,
    )
    expect(newestHeadlessShell("/c", "linux", "x64", fakeFs(dirs, []))).toBeUndefined()
  })
})
