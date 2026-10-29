const FIELDS =
  "[data-autofocus], input:not([type=hidden]):not(:disabled), textarea:not(:disabled), select:not(:disabled)"

/** Focuses the first field in a container instead of the default target; false when none. */
export function focusFirstField(container: HTMLElement | undefined, event: Event): boolean {
  const field = container?.querySelector<HTMLElement>(FIELDS)
  if (!field) return false
  event.preventDefault()
  field.focus()
  return true
}
