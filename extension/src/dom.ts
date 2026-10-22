type Child = Node | string | null | false

/** Builds an element from text and nodes only: nothing is ever parsed as HTML. */
export function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  props: Partial<Record<string, string>> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag)
  for (const [name, value] of Object.entries(props))
    if (value !== undefined) node.setAttribute(name, value)
  for (const child of children) if (child) node.append(child)
  return node
}

/** A button that runs `action` on click (a user gesture, which Ready needs). */
export function button(doc: Document, label: string, action: () => void, disabled = false) {
  const node = el(doc, "button", { type: "button" }, label)
  node.disabled = disabled
  node.addEventListener("click", action)
  return node
}
