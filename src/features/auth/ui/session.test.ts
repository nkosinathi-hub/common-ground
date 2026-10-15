import { describe, expect, it } from "vitest"
import { AuthService } from "../application/auth-service"
import { FakeAuthGateway } from "../testing/fake-auth-gateway"
import { SessionStore } from "./session.svelte"

describe("SessionStore", () => {
  it("is not ready until the first check, then follows auth events", async () => {
    const gateway = new FakeAuthGateway()
    const service = new AuthService(gateway, { origin: "http://x", basePath: "/" })
    const session = new SessionStore(service)
    expect(session.ready).toBe(false)
    await session.start()
    expect(session.ready).toBe(true)
    expect(session.user).toBeNull()
    await service.signUp({ email: "a@b.co", password: "long password", displayName: "A" })
    await service.exchangeCode("user-1")
    expect(session.user?.email).toBe("a@b.co")
    await service.signOut()
    expect(session.user).toBeNull()
    session.dispose()
  })
})

describe("SessionStore identity", () => {
  it("keeps the same user object across token refreshes", async () => {
    const gateway = new FakeAuthGateway()
    const service = new AuthService(gateway, { origin: "http://x", basePath: "/" })
    const session = new SessionStore(service)
    await session.start()
    await service.signUp({ email: "a@b.co", password: "long password", displayName: "A" })
    await service.exchangeCode("user-1")
    const first = session.user
    gateway.onChange(() => {})
    ;(gateway as unknown as { emit: (e: string) => void }).emit("refreshed")
    expect(session.user).toBe(first)
  })
})
