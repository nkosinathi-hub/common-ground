export interface EngineContext {
  readonly env: Record<string, string | undefined>
  readonly home: string
  readonly uid?: number
}

type Adapter = (ctx: EngineContext) => string[]

/** Where each platform's container engines put their API socket or pipe, in preference order. */
const ADAPTERS: Record<string, Adapter> = {
  linux: ({ env, home, uid }) => [
    `${env.XDG_RUNTIME_DIR ?? `/run/user/${uid ?? 1000}`}/podman/podman.sock`,
    "/var/run/docker.sock",
    `${home}/.docker/desktop/docker.sock`,
  ],
  darwin: ({ home }) => [
    `${home}/.local/share/containers/podman/machine/podman.sock`,
    `${home}/.local/share/containers/podman/machine/podman-machine-default/podman.sock`,
    `${home}/.docker/run/docker.sock`,
    `${home}/.colima/default/docker.sock`,
    "/var/run/docker.sock",
  ],
  win32: () => ["//./pipe/podman-machine-default", "//./pipe/docker_engine"],
}

export function socketCandidates(platform: string, ctx: EngineContext): string[] {
  return (ADAPTERS[platform] ?? ADAPTERS.linux!)(ctx)
}

const toUri = (path: string) =>
  path.startsWith("//./pipe/") ? `npipe://${path}` : `unix://${path}`

/** DOCKER_HOST for child processes: an explicit value wins, else the first engine found. */
export function detectDockerHost(
  platform: string,
  ctx: EngineContext,
  exists: (path: string) => boolean,
): string | undefined {
  if (ctx.env.DOCKER_HOST) return ctx.env.DOCKER_HOST
  const found = socketCandidates(platform, ctx).find(exists)
  return found ? toUri(found) : undefined
}
