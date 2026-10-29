/** The open page's own name for the shell's breadcrumb, e.g. the title or idea on screen. */
class PageTitle {
  current = $state("")

  /** Shows the name while the page is open; call the result when it closes. */
  show(title: string): () => void {
    this.current = title
    return () => {
      if (this.current === title) this.current = ""
    }
  }
}

export const pageTitle = new PageTitle()
