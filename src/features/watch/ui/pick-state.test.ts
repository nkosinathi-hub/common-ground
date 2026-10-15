import { describe, expect, it } from "vitest"
import { appError } from "@/shared/domain"
import { WatchService } from "../application/watch-service"
import { FakeWatchGateway } from "../testing/fake-watch-gateway"
import { SPACE_ID, item } from "../testing/fixtures"
import { PickState } from "./pick-state.svelte"

describe("PickState", () => {
  it("picks, retries without repeating and reports an empty queue", async () => {
    const gateway = new FakeWatchGateway()
    gateway.items = [
      item(1, "A", { intent: "watch_together" }),
      item(2, "B", { intent: "watch_together" }),
    ]
    const pick = new PickState(
      new WatchService(gateway),
      () => SPACE_ID,
      () => 0,
    )
    await pick.start()
    expect(pick.open).toBe(true)
    expect(pick.pick?.title).toBe("B")
    await pick.again()
    expect(pick.pick?.title).toBe("A")
    gateway.failWith = appError("network", "down")
    await pick.again()
    expect(pick.error?.message).toBe("down")
    gateway.failWith = null
    gateway.items = []
    await pick.start()
    expect(pick.emptyQueue).toBe(true)
  })
})
