import type { PhonePush } from "./push"

const NONE: PhonePush = { forget: () => Promise.resolve() }

/**
 * Keeps push registered for whoever is signed in. A sign-out, an expired session or another
 * user signing in first forgets the phone, so pushes never reach the wrong person.
 */
export class PushSession {
  private user: string | null = null
  private phone: Promise<PhonePush> = Promise.resolve(NONE)

  constructor(private readonly start: (userId: string) => Promise<PhonePush>) {}

  /** Call with the signed-in user's id, or null; resolves once the change has settled. */
  async follow(userId: string | null): Promise<void> {
    if (userId !== this.user) {
      this.user = userId
      this.phone = this.phone
        .then((phone) => phone.forget())
        .catch(() => {})
        .then(() => (userId ? this.start(userId) : NONE))
        .catch(() => NONE)
    }
    await this.phone
  }
}
