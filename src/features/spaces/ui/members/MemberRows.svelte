<script lang="ts">
  import { Ellipsis } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { InitialAvatar } from "@/shared/ui"
  import type { Member } from "../../domain/space"
  import type { MemberAction } from "../member-actions"

  interface Props {
    members: readonly Member[]
    me: string
    /** The owner manages others from each row's menu. */
    manage: boolean
    onAction: (member: Member, action: MemberAction) => void
  }

  let { members, me, manage, onAction }: Props = $props()
</script>

<!-- D17 Members: avatar, name, role; the owner's menu on everyone else. -->
<ul class="flex flex-col">
  {#each members as member (member.userId)}
    <li class="flex items-center gap-item py-related">
      <InitialAvatar
        name={member.displayName}
        tone={member.userId === me ? "brand" : "secondary"}
        decorative
      />
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="truncate type-label text-foreground">{member.displayName}</span>
        {#if member.userId === me}<span class="type-xs text-muted-foreground">You</span>{/if}
      </div>
      <Badge variant={member.role === "owner" ? "default" : "secondary"}
        >{member.role === "owner" ? "Owner" : "Member"}</Badge
      >
      {#if manage && member.userId !== me}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                aria-label="More for {member.displayName}"><Ellipsis aria-hidden="true" /></Button
              >
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onSelect={() => onAction(member, "transfer")}
              >Make owner</DropdownMenu.Item
            >
            <DropdownMenu.Item variant="destructive" onSelect={() => onAction(member, "remove")}
              >Remove</DropdownMenu.Item
            >
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </li>
  {/each}
</ul>
