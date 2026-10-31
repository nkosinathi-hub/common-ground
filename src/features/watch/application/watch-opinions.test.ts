import { describe, expect, it } from "vitest"
import { FakeWatchOpinions } from "../testing/fake-watch-opinions"
import { WatchOpinions } from "./watch-opinions"

describe("WatchOpinions", () => {
  it("sets an opinion, swaps it, and clears it when the same one is tapped again", async () => {
    const gateway = new FakeWatchOpinions()
    const opinions = new WatchOpinions(gateway)
    await opinions.toggle("s", "t", null, "liked")
    expect(gateway.rows.get("t")).toBe("liked")
    await opinions.toggle("s", "t", "liked", "disliked")
    expect(gateway.rows.get("t")).toBe("disliked")
    await opinions.toggle("s", "t", "disliked", "disliked")
    expect(gateway.rows.has("t")).toBe(false)
  })
})
