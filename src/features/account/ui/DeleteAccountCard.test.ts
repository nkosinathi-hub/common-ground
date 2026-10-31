import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appError, err } from "@/shared/domain"
import { AccountService } from "../application/account-service"
import { FakeAccountRepository, FakeReauthenticator } from "../testing/fake-account"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideAccount } from "./context"
import DeleteAccountCard from "./DeleteAccountCard.svelte"

function setup() {
  const repo = new FakeAccountRepository()
  const onDeleted = vi.fn()
  const service = new AccountService(repo, new FakeReauthenticator())
  render(Provided, {
    props: {
      provide: () => provideAccount({ service }),
      component: DeleteAccountCard,
      props: { onDeleted },
    },
  })
  const fill = async (password: string, confirmation: string) => {
    await fireEvent.input(screen.getByLabelText("Your password"), { target: { value: password } })
    await fireEvent.input(screen.getByLabelText("Type DELETE to confirm"), {
      target: { value: confirmation },
    })
  }
  const button = () => screen.getByRole("button", { name: "Delete account…" })
  return { repo, onDeleted, fill, button }
}

describe("DeleteAccountCard", () => {
  afterEach(cleanup)

  it("stays disabled until the word is typed exactly", async () => {
    const { fill, button } = setup()
    await fill("correct horse", "delete")
    expect(button()).toBeDisabled()
    await fill("correct horse", "DELETE")
    expect(button()).toBeEnabled()
  })

  it("shows the server message verbatim and keeps the account", async () => {
    const { repo, fill, button, onDeleted } = setup()
    const message = "transfer ownership or delete your shared spaces first"
    repo.deleteError = err(appError("validation", message))
    await fill("correct horse", "DELETE")
    await fireEvent.click(button())
    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it("deletes after reauthentication and hands control back", async () => {
    const { fill, button, onDeleted } = setup()
    await fill("correct horse", "DELETE")
    await fireEvent.click(button())
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalledOnce())
  })
})
