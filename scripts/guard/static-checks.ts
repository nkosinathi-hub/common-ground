import { readFileSync } from "node:fs"
import { findEmDashes } from "./em-dash-rule"
import { findLengthViolations } from "./file-length-rule"
import { checkFile } from "./layers-rule"
import { trackedFiles } from "./tracked-files"

const TEXT = /\.(ts|js|svelte|sql|md|json|yml|yaml|toml|css|html|sh)$/
const files = trackedFiles()
  .filter((path) => TEXT.test(path))
  .map((path) => ({ path, text: readFileSync(path, "utf8") }))

const problems = [
  ...findLengthViolations(files).map((v) => `${v.path}: ${v.lines} lines (max 100)`),
  ...findEmDashes(files).map((v) => `${v.path}:${v.line}: em dash`),
  ...files
    .filter((f) => /\.(ts|svelte)$/.test(f.path))
    .flatMap((f) => checkFile(f.path, f.text))
    .map((v) => `${v.path}: layer violation importing "${v.specifier}"`),
]

for (const line of problems) console.error(line)
if (problems.length > 0) process.exit(1)
console.log(`static checks: ${files.length} files clean`)
