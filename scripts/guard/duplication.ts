import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkDuplication, DUPLICATION, type DuplicationReport } from "./duplication-rule"

const out = mkdtempSync(join(tmpdir(), "jscpd-"))
try {
  const args = [...DUPLICATION.paths, "--ignore", DUPLICATION.ignore.join(","), "--gitignore"]
  execFileSync("jscpd", [...args, "--reporters", "json", "--output", out, "--silent"], {
    stdio: "ignore",
  })
  const report = JSON.parse(
    readFileSync(join(out, "jscpd-report.json"), "utf8"),
  ) as DuplicationReport
  const problems = checkDuplication(report)
  for (const line of problems) console.error(line)
  if (problems.length > 0) process.exit(1)
  console.log(
    `duplication: ${report.statistics.total.percentage}% (limit ${DUPLICATION.maxPercent}%)`,
  )
} finally {
  rmSync(out, { recursive: true, force: true })
}
