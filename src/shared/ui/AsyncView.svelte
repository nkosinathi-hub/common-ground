<script lang="ts" generics="T">
  import type { Snippet } from "svelte"
  import ErrorState from "./ErrorState.svelte"
  import Loading from "./Loading.svelte"
  import type { Resource } from "./resource.svelte"

  let { resource, children }: { resource: Resource<T>; children: Snippet<[T]> } = $props()
</script>

{#if resource.state.status === "loading"}
  <Loading />
{:else if resource.state.status === "error"}
  <ErrorState error={resource.state.error} onRetry={resource.retry} />
{:else}
  {@render children(resource.state.value)}
{/if}
