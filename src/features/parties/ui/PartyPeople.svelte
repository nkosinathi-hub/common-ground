<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { SessionView } from "../application/party-session"
  import type { Party } from "../domain/party"
  import { whoIsIn } from "../domain/who-is-in"

  interface Props {
    party: Party
    view: SessionView
    names: readonly MemberRef[]
  }

  let { party, view, names }: Props = $props()
  const everyone = $derived(whoIsIn(party.members, view.state.people))

  function status(userId: string): string {
    const mine = view.state.people.filter((p) => p.userId === userId)
    const player = mine.find((p) => p.role === "player")
    if (player?.buffering) return "Loading on Netflix"
    if (player) return player.ready ? "Ready on Netflix" : "On Netflix, not ready"
    const here = mine[0]
    if (!here) return "Not here"
    if (here.buffering) return "Loading"
    return here.ready ? "Ready" : "Not ready yet"
  }
</script>

<section aria-labelledby="party-people" class="space-y-2 rounded-xl border p-4">
  <h2 id="party-people" class="font-semibold">Who is in</h2>
  <ul class="space-y-1">
    {#each everyone as userId (userId)}
      <li class="flex items-center justify-between gap-2 text-sm">
        <span class="flex items-center gap-2">
          {memberName(names, userId)}
          {#if view.state.hostId === userId}<Badge variant="secondary">Host</Badge>{/if}
        </span>
        <span class="text-muted-foreground">{status(userId)}</span>
      </li>
    {/each}
  </ul>
</section>
