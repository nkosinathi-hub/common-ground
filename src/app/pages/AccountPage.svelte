<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs"
  import { useAuth } from "@/features/auth"
  import type { AccountTab } from "@/shared/domain"
  import { navigate, toast } from "@/shared/ui"
  import DataTab from "./account/DataTab.svelte"
  import ProfileTab from "./account/ProfileTab.svelte"

  interface Props {
    signOut: () => void
    signOutEverywhere: () => void
    /** From the link; a bare /account opens Profile and sign-in. */
    tab?: AccountTab
    /** Inside the app shell, which owns the page's main landmark. */
    framed?: boolean
  }

  let { signOut, signOutEverywhere, tab = "profile", framed = false }: Props = $props()
  const { session } = useAuth()
  const open = (next: string) => navigate({ name: "account", tab: next as AccountTab })

  function deleted() {
    toast.success("Your account was deleted")
    signOut()
  }
</script>

<!-- Figma D18a and D18b: the header, then two tabs, each a link of its own. -->
<svelte:element
  this={framed ? "div" : "main"}
  class="flex flex-col gap-section {framed ? '' : 'mx-auto max-w-content px-gutter py-section'}"
>
  <div class="flex flex-col gap-related">
    <h1 class="type-h1 text-foreground">Account and data</h1>
    <p class="type-body text-muted-foreground">
      Your profile, sign-in, devices and the information we keep.
    </p>
  </div>
  {#if session.user}
    <Tabs.Root value={tab} onValueChange={open} class="flex flex-col gap-section">
      <Tabs.List variant="line" aria-label="Account" class="w-full justify-start">
        <Tabs.Trigger value="profile">Profile and sign-in</Tabs.Trigger>
        <Tabs.Trigger value="data">Data and privacy</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile">
        <ProfileTab
          userId={session.user.id}
          displayName={session.user.displayName}
          {signOutEverywhere}
        />
      </Tabs.Content>
      <Tabs.Content value="data"><DataTab onDeleted={deleted} /></Tabs.Content>
    </Tabs.Root>
  {/if}
</svelte:element>
