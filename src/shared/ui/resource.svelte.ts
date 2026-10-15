import type { AppError, Result } from "@/shared/domain"

export type ResourceState<T> =
  { status: "loading" } | { status: "ready"; value: T } | { status: "error"; error: AppError }

/** Reactive async loader with retry; ignores responses from superseded loads. */
export class Resource<T> {
  state = $state<ResourceState<T>>({ status: "loading" })
  private generation = 0

  constructor(private readonly loader: () => Promise<Result<T>>) {}

  get value(): T | undefined {
    return this.state.status === "ready" ? this.state.value : undefined
  }

  async load(): Promise<void> {
    const mine = ++this.generation
    if (this.state.status !== "ready") this.state = { status: "loading" }
    const result = await this.loader()
    if (mine !== this.generation) return
    this.state = result.ok
      ? { status: "ready", value: result.value }
      : { status: "error", error: result.error }
  }

  retry = () => {
    this.state = { status: "loading" }
    return this.load()
  }

  set(value: T) {
    this.state = { status: "ready", value }
  }
}
