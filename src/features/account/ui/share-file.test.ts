import { describe, expect, it, vi } from "vitest"

const writeFile = vi.fn(() => Promise.resolve({ uri: "file:///cache/a.json" }))
const share = vi.fn(() => Promise.resolve({}))
vi.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
  Filesystem: { writeFile },
}))
vi.mock("@capacitor/share", () => ({ Share: { share } }))

const { shareFile } = await import("./share-file")

describe("shareFile", () => {
  it("writes the export to the app cache and opens the Android share sheet", async () => {
    await shareFile({ filename: "a.json", content: "{}" })
    expect(writeFile).toHaveBeenCalledWith({
      path: "a.json",
      data: "{}",
      directory: "CACHE",
      encoding: "utf8",
    })
    expect(share).toHaveBeenCalledWith({ title: "a.json", files: ["file:///cache/a.json"] })
  })

  it("treats closing the share sheet as done, not as a failure", async () => {
    share.mockRejectedValueOnce(new Error("Share canceled"))
    await expect(shareFile({ filename: "a.json", content: "{}" })).resolves.toBeUndefined()
  })
})
