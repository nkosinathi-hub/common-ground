import { afterEach, describe, expect, it, vi } from "vitest"
import { downloadFile } from "./download"

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("downloadFile", () => {
  it("clicks a temporary link to a JSON blob and revokes the URL", async () => {
    const create = vi.fn(() => "blob:x")
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    vi.useFakeTimers()
    downloadFile({ filename: "a.json", content: "{}" })
    expect(revoke).not.toHaveBeenCalled()
    vi.runAllTimers()
    const blob = (create.mock.calls[0] as unknown as [Blob])[0]
    expect(blob.type).toBe("application/json")
    expect(await blob.text()).toBe("{}")
    expect(click).toHaveBeenCalledOnce()
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe("a.json")
    expect(link.isConnected).toBe(false)
    expect(revoke).toHaveBeenCalledWith("blob:x")
  })
})
