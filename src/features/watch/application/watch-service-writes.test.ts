import { describe, expect, it } from "vitest"
import { appError, type DateOnly } from "@/shared/domain"
import type { ManualTitleInput, ProgressInput } from "../domain/types"
import { FakeWatchGateway } from "../testing/fake-watch-gateway"
import { SPACE_ID, item } from "../testing/fixtures"
import { WatchService } from "./watch-service"

const today = "2026-10-15" as DateOnly
const setup = () => {
  const gateway = new FakeWatchGateway()
  return { gateway, service: new WatchService(gateway, () => today) }
}
const manual: ManualTitleInput = {
  title: " Home ",
  mediaType: "movie",
  releaseYear: null,
  synopsis: "",
  availabilityNote: null,
  intent: "archived",
}

describe("WatchService writes", () => {
  it("validates manual adds and edits, and reports duplicates", async () => {
    const { gateway, service } = setup()
    expect((await service.addManual(SPACE_ID, manual)).ok).toBe(true)
    expect(gateway.items[0]).toMatchObject({ title: "Home", intent: "archived" })
    expect(await service.addManual(SPACE_ID, manual)).toEqual({
      ok: false,
      error: appError("conflict", "Already on your list"),
    })
    expect((await service.addManual(SPACE_ID, { ...manual, title: "" })).ok).toBe(false)
    const id = gateway.items[0]!.id
    expect((await service.updateDetails(id, { ...manual, title: "" })).ok).toBe(false)
    const renamed = { ...manual, title: "Renamed", availabilityNote: "Box" }
    expect((await service.updateDetails(id, renamed)).ok).toBe(true)
    expect(gateway.items[0]).toMatchObject({ title: "Renamed", availabilityNote: "Box" })
  })

  it("adds catalog titles once, changes intent and deletes", async () => {
    const { gateway, service } = setup()
    const pick = {
      catalog: { type: "movie", id: 7 },
      title: "Dune",
      mediaType: "movie",
      releaseYear: 2021,
      synopsis: "",
      posterPath: null,
    } as const
    const id = await service.addCatalog(SPACE_ID, pick, "watch_together")
    expect((await service.addCatalog(SPACE_ID, pick, "watch_together")).ok).toBe(false)
    if (!id.ok) throw new Error("add failed")
    await service.setIntent(id.value, "archived")
    expect((await service.get(SPACE_ID, id.value)).ok && gateway.items[0]?.intent).toBe("archived")
    expect((await service.remove(id.value)).ok).toBe(true)
    expect((await service.get(SPACE_ID, id.value)).ok).toBe(false)
  })

  it("validates progress and sessions before saving", async () => {
    const { gateway, service } = setup()
    gateway.items = [item(1, "Show")]
    const id = gateway.items[0]!.id
    const progress: ProgressInput = {
      status: "watching",
      season: 1,
      episode: -1,
      completedOn: null,
    }
    expect((await service.saveProgress(id, progress)).ok).toBe(false)
    expect((await service.saveProgress(id, { ...progress, episode: 2 })).ok).toBe(true)
    expect((await service.progress(id)).ok && gateway.progressRows).toHaveLength(1)
    const session = { watchedOn: today, memberIds: ["a"], note: "" }
    expect((await service.logSession(id, { ...session, memberIds: [] })).ok).toBe(false)
    expect((await service.logSession(id, session)).ok).toBe(true)
    const sessions = await service.sessions(id)
    expect(sessions.ok && sessions.value).toHaveLength(1)
  })
})
