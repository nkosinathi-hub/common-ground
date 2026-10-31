import { createRawSnippet, type Snippet } from "svelte"

/** A snippet rendering fixed markup, for passing children to a component under test. */
export const html = (markup: string): Snippet =>
  createRawSnippet(() => ({ render: () => markup.trim() }))
