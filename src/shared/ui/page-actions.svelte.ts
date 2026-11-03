import { getContext, setContext, type Component } from "svelte"

export interface PageActionSpec {
  label: string
  icon: Component
  disabled?: boolean
  onclick: () => void
}

const KEY = Symbol("page-actions")

/** A page supplies its primary action; the shell places it for the available space. */
export class PageActions {
  current = $state.raw<PageActionSpec | null>(null)

  register(action: PageActionSpec): () => void {
    this.current = action
    return () => {
      if (this.current === action) this.current = null
    }
  }
}

export const providePageActions = () => setContext(KEY, new PageActions())
export const usePageActions = (): PageActions | undefined => getContext(KEY)
