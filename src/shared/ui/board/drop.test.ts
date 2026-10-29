import { TRIGGERS } from "svelte-dnd-action"
import { describe, expect, it } from "vitest"
import { dropIn } from "./drop"

const items = [{ id: "a" }, { id: "b" }]
const info = (trigger: TRIGGERS, id = "b") => ({ trigger, id, source: "pointer" as never })

describe("dropIn", () => {
  it("reports the card dropped into this column and where", () => {
    expect(dropIn(items, info(TRIGGERS.DROPPED_INTO_ZONE))).toEqual({ id: "b", index: 1 })
  })

  it("ignores the column a card left, a cancelled drag, and a card it does not hold", () => {
    expect(dropIn(items, info(TRIGGERS.DROPPED_INTO_ANOTHER))).toBeNull()
    expect(dropIn(items, info(TRIGGERS.DROPPED_OUTSIDE_OF_ANY))).toBeNull()
    expect(dropIn(items, info(TRIGGERS.DROPPED_INTO_ZONE, "z"))).toBeNull()
  })
})
