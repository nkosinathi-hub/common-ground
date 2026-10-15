import { describe, expect, it } from "vitest"
import { detectDockerHost, socketCandidates } from "./engine"

const ctx = (env: Record<string, string> = {}) => ({ env, home: "/h", uid: 1000 })
const only = (path: string) => (candidate: string) => candidate === path

describe("container engine detection", () => {
  it("keeps an explicit DOCKER_HOST", () => {
    const host = detectDockerHost("linux", ctx({ DOCKER_HOST: "tcp://x:2375" }), () => false)
    expect(host).toBe("tcp://x:2375")
  })

  it("prefers rootless podman on Linux, using XDG_RUNTIME_DIR when set", () => {
    const env = { XDG_RUNTIME_DIR: "/run/user/42" }
    const sock = "/run/user/42/podman/podman.sock"
    expect(detectDockerHost("linux", ctx(env), only(sock))).toBe(`unix://${sock}`)
    expect(socketCandidates("linux", ctx())[0]).toBe("/run/user/1000/podman/podman.sock")
  })

  it("falls back to the Docker socket on Linux", () => {
    const host = detectDockerHost("linux", ctx(), only("/var/run/docker.sock"))
    expect(host).toBe("unix:///var/run/docker.sock")
  })

  it("finds podman machine or Docker Desktop on macOS", () => {
    const machine = "/h/.local/share/containers/podman/machine/podman.sock"
    expect(detectDockerHost("darwin", ctx(), only(machine))).toBe(`unix://${machine}`)
    const desktop = "/h/.docker/run/docker.sock"
    expect(detectDockerHost("darwin", ctx(), only(desktop))).toBe(`unix://${desktop}`)
  })

  it("uses named pipes on Windows", () => {
    const pipe = "//./pipe/podman-machine-default"
    expect(detectDockerHost("win32", ctx(), only(pipe))).toBe(`npipe://${pipe}`)
  })

  it("returns undefined when no engine is reachable", () => {
    expect(detectDockerHost("linux", ctx(), () => false)).toBeUndefined()
  })
})
