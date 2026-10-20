import type { SimklGateway } from "./ports"

/** Connecting Simkl, importing its history, and the one background sync per app open. */
export class SimklService {
  /** Users already synced since the app opened; the service lives as long as the app does. */
  private readonly opened = new Set<string>()

  constructor(private readonly gateway: SimklGateway) {}

  status = () => this.gateway.status()
  startPin = () => this.gateway.startPin()
  poll = (interval: number) => this.gateway.poll(interval)
  sync = () => this.gateway.sync()
  disconnect = () => this.gateway.disconnect()

  /**
   * Once per app open and person: when Simkl is connected, import what is new. Never repeats
   * on a timer (Simkl asks apps not to poll in the background); failures wait for next open.
   */
  async syncOnOpen(userId: string): Promise<void> {
    if (this.opened.has(userId)) return
    this.opened.add(userId)
    const link = await this.gateway.status()
    if (link.ok && link.value) await this.gateway.sync()
  }
}
