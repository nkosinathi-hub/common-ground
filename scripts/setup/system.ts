import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { detectDockerHost } from "./engine"

const shell = process.platform === "win32"

/** Runs a command with inherited output; throws with the step name when it fails. */
export function run(step: string, command: string, args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(command, args, { stdio: "inherit", env, shell })
  if (result.status !== 0) throw new Error(`${step} failed: ${command} ${args.join(" ")}`)
}

/** Runs a command and returns stdout, or null when it exits non-zero. */
export function capture(command: string, args: string[], env: NodeJS.ProcessEnv): string | null {
  const result = spawnSync(command, args, { encoding: "utf8", env, shell })
  return result.status === 0 ? result.stdout : null
}

const pipePath = (path: string) => path.replaceAll("/", "\\")

/** Detects the container engine for this machine; DOCKER_HOST in the environment wins. */
export function dockerHost(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const ctx = { env, home: homedir(), uid: process.getuid?.() }
  const exists = (path: string) => existsSync(process.platform === "win32" ? pipePath(path) : path)
  return detectDockerHost(process.platform, ctx, exists)
}
