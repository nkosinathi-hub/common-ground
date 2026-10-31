import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { AuthService } from "../application/auth-service"
import { FakeAuthGateway } from "../testing/fake-auth-gateway"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideAuth } from "./context"
import { SessionStore } from "./session-store.svelte"
import SignInPage from "./SignInPage.svelte"

afterEach(cleanup)

async function setup() {
  const gateway = new FakeAuthGateway()
  const service = new AuthService(gateway, { origin: "http://x", basePath: "/" })
  await service.signUp({ email: "ana@x.co", password: "a long password", displayName: "Ana" })
  const provide = () => provideAuth({ service, session: new SessionStore(service) })
  render(Provided, { props: { provide, component: SignInPage } })
  return gateway
}

async function signIn(password: string) {
  await fireEvent.input(screen.getByLabelText("Email"), { target: { value: "ana@x.co" } })
  await fireEvent.input(screen.getByLabelText("Password"), { target: { value: password } })
  await fireEvent.click(screen.getByRole("button", { name: "Sign in" }))
}

describe("SignInPage", () => {
  it("offers to resend the verification email while the address is unconfirmed", async () => {
    const gateway = await setup()
    await signIn("a long password")
    await fireEvent.click(await screen.findByRole("button", { name: /resend verification/i }))
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Check your inbox"))
    expect(gateway.sent.filter((s) => s.kind === "verify")).toHaveLength(2)
  })

  it("does not offer a resend for a wrong password", async () => {
    await setup()
    await signIn("wrong password")
    expect(await screen.findByRole("alert")).toHaveTextContent("incorrect")
    expect(screen.queryByRole("button", { name: /resend verification/i })).toBeNull()
  })
})
