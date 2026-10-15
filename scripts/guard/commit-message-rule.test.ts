import { describe, expect, it } from "vitest"
import { checkCommitMessage } from "./commit-message-rule"

describe("commit message rule", () => {
  it("accepts one conventional line with an issue reference", () => {
    expect(checkCommitMessage("feat: invites, single-use redemption (#7)\n")).toEqual([])
    expect(checkCommitMessage("fix(auth): retry on outage (#4)")).toEqual([])
  })

  it("rejects bodies, trailers, merges and unknown types", () => {
    expect(checkCommitMessage("feat: x (#1)\n\nbody")).toContain(
      "subject only, no body or trailers",
    )
    expect(checkCommitMessage("feat: x (#1)\n\nCo-Authored-By: Someone <a@b.c>")).toContain(
      "no Co-Authored-By",
    )
    expect(checkCommitMessage("merge: ideas (#13)")).toContain("conventional type required")
    expect(checkCommitMessage("feat: no issue")).toContain("reference an issue like (#12)")
  })

  it("ignores git's own comment lines", () => {
    expect(checkCommitMessage("chore: tidy (#2)\n# Please enter the commit message\n")).toEqual([])
  })
})
