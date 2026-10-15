import { readFileSync } from "node:fs"
import { findEmDashes } from "./em-dash-rule"
import { findEmoji } from "./emoji-rule"
import { findLengthViolations } from "./file-length-rule"
import { checkFile } from "./layers-rule"
import { checkPurity } from "./purity-rule"
import { trackedFiles } from "./tracked-files"

// Every tracked text file, including dot files and extensionless scripts. Binaries hold NUL bytes.
const BINARY = /\.(png|jpe?g|webp|gif|ico|pdf|woff2?|zip)$/i
const files = trackedFiles()
  .filter((path) => !BINARY.test(path))
  .map((path) => ({ path, text: readFileSync(path, "utf8") }))
  .filter((file) => !file.text.includes("\u0000"))
const code = files.filter((f) => /\.(ts|svelte)$/.test(f.path))

const problems = [
  ...findLengthViolations(files).map((v) => `${v.path}: ${v.lines} lines (max 100)`),
  ...findEmDashes(files).map((v) => `${v.path}:${v.line}: em dash`),
  ...findEmoji(files).map((v) => `${v.path}:${v.line}: emoji`),
  ...code
    .flatMap((f) => checkFile(f.path, f.text))
    .map((v) => `${v.path}: layer violation importing "${v.specifier}"`),
  ...code.flatMap((f) => checkPurity(f.path, f.text)).map((v) => `${v.path}: ${v.reason}`),
]

for (const line of problems) console.error(line)
if (problems.length > 0) process.exit(1)
console.log(`static checks: ${files.length} files clean`)
