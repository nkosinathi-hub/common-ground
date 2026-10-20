// GitHub Pages cannot send frame-ancestors, so a page that frames the app could overlay it and
// trick a click (clickjacking). The app renders nothing until it mounts, so refusing to mount
// inside a frame leaves nothing to click but a way out.

export const isFramed = (view: Window): boolean => view.top !== view.self

export function refuseFrame(target: HTMLElement, appUrl: string): void {
  const message = document.createElement("p")
  message.textContent = "Common Ground only opens in its own tab. "
  const link = document.createElement("a")
  link.href = appUrl
  link.target = "_top"
  link.rel = "noopener noreferrer"
  link.textContent = "Open Common Ground"
  message.append(link)
  target.replaceChildren(message)
}
