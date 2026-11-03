interface SearchElements {
  root: HTMLElement | undefined
  input: HTMLInputElement | null
  open: boolean
  focus: () => void
  close: () => void
}
/** Ordinary links keep Tab navigation; arrows provide a shortcut through the open results. */
export function searchKeys(event: KeyboardEvent, view: SearchElements) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault()
    view.focus()
    return
  }
  if (!view.open || !view.root?.contains(document.activeElement)) return
  if (event.key === "Escape") {
    event.preventDefault()
    view.close()
    return
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
  const targets = [
    view.input,
    ...view.root.querySelectorAll<HTMLElement>(
      "[data-search-results] a, [data-search-results] button:not(:disabled)",
    ),
  ].filter((el): el is HTMLElement => Boolean(el))
  const index = targets.indexOf(document.activeElement as HTMLElement)
  event.preventDefault()
  targets[(index + (event.key === "ArrowDown" ? 1 : -1) + targets.length) % targets.length]?.focus()
}
