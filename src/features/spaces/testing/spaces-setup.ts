import { appError, err, ok } from "@/shared/domain"
import { SpacesService } from "../application/spaces-service"
import { FakeSpacesGateway, MemoryActiveSpace } from "./fake-spaces"

export const NOW = new Date("2026-10-15T12:00:00Z")
export const PASSWORD = "right password"

/** A SpacesService over in-memory fakes, a fixed clock and one accepted password. */
export function spacesSetup() {
  const gateway = new FakeSpacesGateway()
  const active = new MemoryActiveSpace()
  const auth = {
    reauthenticate: async (password: string) =>
      password === PASSWORD ? ok(undefined) : err(appError("denied", "Password is incorrect")),
  }
  const service = new SpacesService({
    gateway,
    active,
    auth,
    appUrl: "https://x.io/cg/",
    clock: () => NOW,
  })
  return { gateway, active, service }
}
