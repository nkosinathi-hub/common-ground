<script lang="ts">
  import type { SourceSession } from "./source-session.svelte"
  import SourcePicker from "./SourcePicker.svelte"
  let {
    session,
    time,
    paused,
    onretry,
  }: { session: SourceSession; time: number; paused: boolean; onretry?: () => void } = $props()
</script>

{#if session.source?.providerId === "demo-preview"}
  <p class="type-sm text-muted-foreground">
    Sample preview. This clip demonstrates the player, not the selected title.
  </p>
{/if}
{#if session.message}<p role="status" class="type-sm">{session.message}</p>{/if}
{#if !session.refreshing}
  <SourcePicker
    sources={session.sources}
    index={session.index}
    onchange={(index) => session.select(index, time, paused)}
    onretry={() => void session.retry(onretry)}
  />
{/if}
