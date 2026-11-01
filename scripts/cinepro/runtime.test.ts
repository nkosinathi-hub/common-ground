import { execFileSync } from "node:child_process"
import { expect, it } from "vitest"

it("the pinned CinePro runtime passes its deadline, cancellation and idempotence tests", () => {
  const output = execFileSync(
    process.execPath,
    ["--test", "--test-reporter=tap", "cinepro/runtime/runtime.test.mjs"],
    {
      encoding: "utf8",
    },
  )
  expect(output).toContain("# fail 0")
})
