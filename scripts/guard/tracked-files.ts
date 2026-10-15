import { execFileSync } from "node:child_process"

export function trackedFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
  return out.split("\n").filter(Boolean)
}
