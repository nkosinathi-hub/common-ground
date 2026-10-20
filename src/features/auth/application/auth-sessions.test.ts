import { describe, expect, it } from "vitest"
import { FakeAuthGateway } from "../testing/fake-auth-gateway"
import { AuthService } from "./auth-service"

describe("AuthService sessions", () => {
  it("signs out here, or everywhere", async () => {
    const gateway = new FakeAuthGateway()
    const service = new AuthService(gateway, { origin: "https://x.github.io", basePath: "/" })
    await service.signOutEverywhere()
    await service.signOut()
    expect(gateway.signOuts).toEqual(["global", "local"])
  })
})
