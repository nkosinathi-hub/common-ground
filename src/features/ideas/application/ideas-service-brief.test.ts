import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"

const setup = async () => {
  const { repo, service: ideas } = inMemoryIdeasService()
  const created = await ideas.capture({ spaceId: "s", title: "Zine" })
  if (!created.ok) throw new Error("capture failed")
  return { repo, ideas, idea: created.value }
}

describe("IdeasService.saveBrief", () => {
  it("saves the brief, then reports a conflict with the latest copy when stale", async () => {
    const { ideas, idea } = await setup()
    const first = await ideas.saveBrief(idea, { pitch: "Mine" })
    expect(first.ok && first.value.status).toBe("saved")
    const stale = await ideas.saveBrief(idea, { pitch: "Old tab" })
    expect(stale.ok && stale.value).toMatchObject({
      status: "conflict",
      latest: { brief: { pitch: "Mine" } },
    })
  })

  it("rejects an oversized brief before saving", async () => {
    const { ideas, idea } = await setup()
    const result = await ideas.saveBrief(idea, { problem: "x".repeat(4001) })
    expect(result.ok ? null : result.error.field).toBe("problem")
  })

  it("passes through non-conflict failures", async () => {
    const { repo, ideas, idea } = await setup()
    repo.updateBrief = async () => err(appError("denied", "No"))
    const result = await ideas.saveBrief(idea, { pitch: "x" })
    expect(result.ok ? null : result.error.kind).toBe("denied")
  })

  it("still reports a conflict when the latest copy cannot be read", async () => {
    const { repo, ideas, idea } = await setup()
    repo.updateBrief = async () => err(appError("conflict", "Changed"))
    repo.get = async () => err(appError("network", "Offline"))
    const result = await ideas.saveBrief(idea, { pitch: "x" })
    expect(result.ok ? null : result.error.kind).toBe("conflict")
  })
})
