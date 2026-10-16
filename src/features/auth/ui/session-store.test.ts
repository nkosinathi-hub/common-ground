import { describe, expect, it } from "vitest"
import { AuthService } from "../application/auth-service"
import { FakeAuthGateway } from "../testing/fake-auth-gateway"
import { SessionStore } from "./session-store.svelte"

const setup = () => {
  const gateway = new FakeAuthGateway()
  const service = new AuthService(gateway, { origin: "http://x", basePath: "/" })
  return { gateway, service, session: new SessionStore(service) }
}
const signUp = { email: "a@b.co", password: "long password", displayName: "A" }

describe("SessionStore", () => {
  it("reads the current user on start, then follows auth events", async () => {
    const { service, session } = setup()
    await session.start()
    expect(session.user).toBeNull()
    await service.signUp(signUp)
    await service.exchangeCode("user-1")
    expect(session.user?.email).toBe("a@b.co")
    await service.signOut()
    expect(session.user).toBeNull()
    session.dispose()
  })

  it("keeps the same user object across token refreshes", async () => {
    const { gateway, service, session } = setup()
    await session.start()
    await service.signUp(signUp)
    await service.exchangeCode("user-1")
    const first = session.user
    gateway.emit("refreshed")
    expect(session.user).toBe(first)
  })
})
