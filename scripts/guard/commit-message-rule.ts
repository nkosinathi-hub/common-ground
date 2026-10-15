const TYPES = "feat|fix|chore|docs|refactor|test|ci|build|perf|style|revert"
const SUBJECT = new RegExp(`^(${TYPES})(\\([a-z0-9-]+\\))?!?: \\S`)

/** Single-line conventional commits that reference an issue; no body, no co-author trailers. */
export function checkCommitMessage(message: string): string[] {
  const lines = message.split("\n").filter((line) => !line.startsWith("#"))
  const [subject = "", ...rest] = lines
  const problems: string[] = []
  if (!SUBJECT.test(subject)) problems.push("conventional type required")
  if (!/\(#\d+(, #\d+)*\)/.test(subject)) problems.push("reference an issue like (#12)")
  if (rest.some((line) => line.trim() !== "")) problems.push("subject only, no body or trailers")
  if (/co-authored-by/i.test(message)) problems.push("no Co-Authored-By")
  return problems
}
