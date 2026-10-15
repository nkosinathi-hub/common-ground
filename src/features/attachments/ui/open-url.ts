/** Opens a short-lived signed URL. Isolated so tests can replace it. */
export function openUrl(url: string): void {
  const link = document.createElement("a")
  link.href = url
  link.rel = "noopener"
  link.click()
}
