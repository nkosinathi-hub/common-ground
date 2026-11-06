import { getContext, setContext, untrack, type Component } from "svelte"

export interface PageActionSpec {
  label: string
  icon: Component
  disabled?: boolean
  order?: number
  onclick: () => void
}

const KEY = Symbol("page-actions")

/** A page supplies its primary action; the shell places it for the available space. */
export class PageActions {
  current = $state.raw<PageActionSpec | null>(null)
  tools = $state.raw<PageActionSpec[]>([])

  registerTool(action: PageActionSpec): () => void {
    untrack(() => {
      this.tools = [...this.tools, action].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
    return () => {
      this.tools = this.tools.filter((tool) => tool !== action)
    }
  }

  register(action: PageActionSpec): () => void {
    this.current = action
    return () => {
      if (this.current === action) this.current = null
    }
  }
}

export const providePageActions = () => setContext(KEY, new PageActions())
export const usePageActions = (): PageActions | undefined => getContext(KEY)
