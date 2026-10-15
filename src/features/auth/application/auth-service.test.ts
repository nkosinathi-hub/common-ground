import { describe, expect, it } from "vitest"
import { FakeAuthGateway } from "../testing/fake-auth-gateway"
import { AuthService } from "./auth-service"

const setup = () => {
  const gateway = new FakeAuthGateway()
  const service = new AuthService(gateway, { origin: "https://x.github.io", basePath: "/common-ground/" })
  return { gateway, service }
}
const input = { email: "Ana@Example.com", password: "a long password", displayName: "Ana" }

describe("AuthService", () => {
  it("signs up with a verification link under the base path", async () => {
    const { gateway, service } = setup()
    expect((await service.signUp(input)).ok).toBe(true)
    expect(gateway.sent).toEqual([
      { kind: "verify", email: "ana@example.com", redirectTo: "https://x.github.io/common-ground/?next=home" },
    ])
  })

  it("refuses sign-in before verification, then allows it", async () => {
    const { gateway, service } = setup()
    await service.signUp(input)
    expect((await service.signIn(input.email, input.password)).ok).toBe(false)
    await service.exchangeCode("user-1")
    await service.signOut()
    expect((await service.signIn(input.email, input.password)).ok).toBe(true)
    expect(await gateway.currentUser()).toMatchObject({ emailConfirmed: true })
  })

  it("rejects invalid input before calling the gateway", async () => {
    const { gateway, service } = setup()
    expect((await service.signUp({ ...input, password: "short" })).ok).toBe(false)
    expect((await service.requestPasswordReset("nope")).ok).toBe(false)
    expect(gateway.sent).toEqual([])
  })

  it("sends reset links that land on the new-password screen", async () => {
    const { gateway, service } = setup()
    await service.requestPasswordReset("ana@example.com")
    expect(gateway.sent[0]?.redirectTo).toBe("https://x.github.io/common-ground/?next=new-password")
  })

  it("updates the password only when it is long enough", async () => {
    const { service } = setup()
    await service.signUp(input)
    await service.exchangeCode("user-1")
    expect((await service.updatePassword("short")).ok).toBe(false)
    expect((await service.updatePassword("another long one")).ok).toBe(true)
    expect((await service.reauthenticate("another long one")).ok).toBe(true)
  })
})
