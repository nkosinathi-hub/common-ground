import { flushSync } from "svelte"
import { describe, expect, it } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { spacePeople } from "./people.svelte"

const ana = { id: "ana", displayName: "Ana" }
const ben = { id: "ben", displayName: "Ben (former)" }

async function mounted(authorsFail = false) {
  let people!: ReturnType<typeof spacePeople>
  const stop = $effect.root(() => {
    people = spacePeople(
      {
        members: { members: async () => ok([ana]) },
        authors: {
          authors: async () => (authorsFail ? err(appError("network", "down")) : ok([ana, ben])),
        },
      },
      () => "s1",
    )
  })
  flushSync()
  await new Promise((resolve) => setTimeout(resolve))
  stop()
  return people
}

describe("spacePeople", () => {
  it("loads current members for pickers and author names on mount", async () => {
    const people = await mounted()
    expect(people.members).toEqual([ana])
    expect(people.authors).toEqual([ana, ben])
  })

  it("names authors from current members when author names fail", async () => {
    expect((await mounted(true)).authors).toEqual([ana])
  })
})
