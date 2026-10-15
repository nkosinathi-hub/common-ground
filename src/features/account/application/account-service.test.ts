import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { FakeAccountRepository, FakeReauthenticator } from "../testing/fake-account"
import { AccountService } from "./account-service"

const now = new Date(2026, 9, 15)
const setup = () => {
  const repo = new FakeAccountRepository()
  const auth = new FakeReauthenticator()
  return { repo, auth, service: new AccountService(repo, auth, () => now) }
}

describe("AccountService exports", () => {
  it("exports a space as a named, pretty JSON file", async () => {
    const { repo, service } = setup()
    repo.spaces.s1 = { space: { name: "Us" } }
    const file = await service.exportSpace({ id: "s1", name: "Us" })
    expect(file).toEqual({
      ok: true,
      value: {
        filename: "common-ground-us-2026-10-15.json",
        content: JSON.stringify({ space: { name: "Us" } }, null, 2),
      },
    })
  })

  it("passes repository errors through", async () => {
    const { service } = setup()
    expect(await service.exportSpace({ id: "nope", name: "X" })).toMatchObject({ ok: false })
  })

  it("exports my data under its own name", async () => {
    const { service } = setup()
    const file = await service.exportMe()
    expect(file.ok && file.value.filename).toBe("common-ground-my-data-2026-10-15.json")
  })
})

describe("AccountService profile and password", () => {
  it("validates and trims the display name", async () => {
    const { repo, service } = setup()
    expect((await service.changeDisplayName("u1", "  ")).ok).toBe(false)
    expect((await service.changeDisplayName("u1", " Ana ")).ok).toBe(true)
    expect(repo.names.get("u1")).toBe("Ana")
  })

  it("changes the password only after confirming the current one", async () => {
    const { auth, service } = setup()
    const wrong = await service.changePassword("bad", "a much longer one")
    expect(wrong).toEqual(err(appError("denied", "Password is incorrect", "currentPassword")))
    expect((await service.changePassword("correct horse", "a much longer one")).ok).toBe(true)
    expect(auth.password).toBe("a much longer one")
  })
})

describe("AccountService.deleteAccount", () => {
  it("requires the confirmation word before anything else", async () => {
    const { repo, service } = setup()
    const result = await service.deleteAccount("correct horse", "delete")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.field).toBe("confirmation")
    expect(repo.calls).toEqual([])
  })

  it("requires the password and does not delete on a wrong one", async () => {
    const { repo, service } = setup()
    const result = await service.deleteAccount("bad", "DELETE")
    expect(result).toEqual(err(appError("denied", "Password is incorrect", "password")))
    expect(repo.calls).toEqual([])
  })

  it("reauthenticates then deletes, surfacing server messages verbatim", async () => {
    const { repo, service } = setup()
    expect((await service.deleteAccount("correct horse", "DELETE")).ok).toBe(true)
    const blocked = appError("validation", "transfer ownership or delete your shared spaces first")
    repo.deleteError = err(blocked)
    expect(await service.deleteAccount("correct horse", "DELETE")).toEqual(err(blocked))
    expect(repo.calls).toEqual(["deleteMe", "deleteMe"])
  })
})
