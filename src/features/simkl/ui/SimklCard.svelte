<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { ExternalLink, RefreshCw } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { formatDateTime } from "@/shared/domain"
  import { Loading } from "@/shared/ui"
  import { useSimkl } from "./context"
  import { SimklConnection } from "./simkl-connection.svelte"

  const { service } = useSimkl()
  const connection = new SimklConnection(service)
  const state = $derived(connection.state)
  const note = $derived("note" in state ? state.note : undefined)

  onMount(() => void connection.load())
  onDestroy(() => connection.dispose())
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Watch history from Simkl</Card.Title>
    <Card.Description>
      Optional. Bring in what you have watched on Simkl: episodes and films already on your lists
      are ticked as yours in every space. Simkl never sees your spaces.
    </Card.Description>
  </Card.Header>
  <Card.Content class="grid gap-3">
    {#if state.kind === "loading"}
      <Loading label="Checking Simkl" />
    {:else if state.kind === "failed"}
      <p role="alert" class="text-sm text-destructive">{state.message}</p>
    {:else if state.kind === "disconnected"}
      <Button
        class="w-fit"
        variant="outline"
        disabled={connection.busy}
        onclick={() => connection.connect()}>Connect Simkl</Button
      >
    {:else if state.kind === "pending"}
      <a
        href={state.pin.verificationUriComplete}
        target="_blank"
        rel="noopener noreferrer"
        class="flex w-fit items-center gap-1 font-medium text-primary hover:underline"
      >
        <ExternalLink class="size-4" aria-hidden="true" />Open Simkl to approve</a
      >
      <p class="text-sm text-muted-foreground">
        Or go to
        <a
          href={state.pin.verificationUri}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline"
          >{state.pin.verificationUri.replace(/^https:\/\//, "")}</a
        >
        and enter
        <span class="font-mono font-semibold tracking-widest">{state.pin.userCode}</span>
      </p>
      <p class="text-sm text-muted-foreground">Waiting for you to approve it on Simkl.</p>
      <Button class="w-fit" variant="ghost" onclick={() => connection.cancel()}>Cancel</Button>
    {:else}
      <p class="text-sm">
        {state.link.lastSyncedAt
          ? `Last synced ${formatDateTime(state.link.lastSyncedAt)}`
          : "Connected. Not synced yet"}
      </p>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" disabled={connection.busy} onclick={() => connection.syncNow()}>
          <RefreshCw aria-hidden="true" /> Sync now
        </Button>
        <Button variant="ghost" disabled={connection.busy} onclick={() => connection.disconnect()}
          >Disconnect</Button
        >
      </div>
    {/if}
    {#if note}
      <p role="status" class="text-sm text-muted-foreground">{note}</p>
    {/if}
  </Card.Content>
</Card.Root>
