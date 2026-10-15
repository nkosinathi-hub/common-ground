export type Latest<T> = { readonly current: true; readonly value: T } | { readonly current: false }

/**
 * Runs one request at a time: starting a new one aborts the previous, and a superseded
 * request reports current: false so its result is never shown. Pair it with a UI debounce.
 */
export class LatestRequest {
  private controller: AbortController | null = null

  async run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<Latest<T>> {
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    const superseded = () => controller.signal.aborted || this.controller !== controller
    try {
      const value = await task(controller.signal)
      if (superseded()) return { current: false }
      this.controller = null
      return { current: true, value }
    } catch (error) {
      if (superseded()) return { current: false }
      this.controller = null
      throw error
    }
  }

  cancel(): void {
    this.controller?.abort()
    this.controller = null
  }
}
