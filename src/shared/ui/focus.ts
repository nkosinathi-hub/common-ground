const FIELDS =
  "[data-autofocus], input:not([type=hidden]):not(:disabled), textarea:not(:disabled), select:not(:disabled)"

/** Touch dialogs keep their default Close target so opening one never summons the keyboard. */
export function focusFirstField(container: HTMLElement | undefined, event: Event): boolean {
  if (window.matchMedia("(pointer: coarse)").matches) return false
  const field = container?.querySelector<HTMLElement>(FIELDS)
  if (!field) return false
  event.preventDefault()
  field.focus()
  return true
}
