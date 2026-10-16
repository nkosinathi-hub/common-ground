/** The viewer's own IANA zone, as the browser resolves it. */
export const viewerZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

/** md and up (Tailwind's 48rem), where the month view is the default. */
export const isWide = (): boolean =>
  typeof matchMedia !== "function" || matchMedia("(min-width: 48rem)").matches

/** Hands the viewer a file to save. */
export function saveFile(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = Object.assign(document.createElement("a"), { href: url, download: name })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
