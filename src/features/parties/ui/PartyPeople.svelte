<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { SessionView } from "../application/party-session"
  import type { Party } from "../domain/party"

  interface Props {
    party: Party
    view: SessionView
    names: readonly MemberRef[]
  }

  let { party, view, names }: Props = $props()

  function status(userId: string): string {
    const here = view.state.people.find((p) => p.userId === userId)
    if (!here) return "Not here"
    if (here.buffering) return "Loading"
    return here.ready ? "Ready" : "Not ready yet"
  }
</script>

<section aria-labelledby="party-people" class="space-y-2 rounded-xl border p-4">
  <h2 id="party-people" class="font-semibold">Who is in</h2>
  <ul class="space-y-1">
    {#each party.members as member (member.userId)}
      <li class="flex items-center justify-between gap-2 text-sm">
        <span class="flex items-center gap-2">
          {memberName(names, member.userId)}
          {#if view.state.hostId === member.userId}<Badge variant="secondary">Host</Badge>{/if}
        </span>
        <span class="text-muted-foreground">{status(member.userId)}</span>
      </li>
    {/each}
  </ul>
</section>
