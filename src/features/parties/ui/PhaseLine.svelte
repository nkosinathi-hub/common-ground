<script lang="ts">
  import type { SessionView } from "../application/party-session"

  interface Props {
    view: SessionView
  }

  let { view }: Props = $props()

  const LABELS = {
    lobby: "Waiting for everyone to be ready",
    playing: "Playing",
    paused: "Paused",
    waiting: "Waiting for someone to catch up",
    ended: "Finished",
  } as const
</script>

<p class="text-sm font-medium" aria-live="polite">
  {LABELS[view.state.phase]}
  {#if !view.connected}<span class="text-muted-foreground"> (reconnecting)</span>{/if}
</p>
