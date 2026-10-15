import { readFileSync } from "node:fs"
import { checkCommitMessage } from "./commit-message-rule"

// lefthook commit-msg hook: argv[2] is the message file git wrote.
const problems = checkCommitMessage(readFileSync(process.argv[2] ?? "", "utf8"))
for (const problem of problems) console.error(`commit message: ${problem}`)
if (problems.length > 0) process.exit(1)
