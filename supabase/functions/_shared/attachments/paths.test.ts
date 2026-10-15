import { describe, expect, it } from "vitest"
import { buildObjectPath } from "./paths.ts"

const space = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const idea = "1b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"
const upload = "2b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f62"

describe("object paths", () => {
  it("builds <space>/<idea>/<upload> in lower case", () => {
    expect(buildObjectPath({ spaceId: space.toUpperCase(), ideaId: idea, uploadId: upload })).toBe(
      `${space}/${idea}/${upload}`,
    )
  })

  it("refuses parts that are not uuids, so no traversal can be built", () => {
    expect(() => buildObjectPath({ spaceId: "..", ideaId: idea, uploadId: upload })).toThrow()
    expect(() =>
      buildObjectPath({ spaceId: space, ideaId: `${idea}/x`, uploadId: upload }),
    ).toThrow()
  })
})
