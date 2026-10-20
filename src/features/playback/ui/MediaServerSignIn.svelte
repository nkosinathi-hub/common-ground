<script lang="ts">
  import { LogIn } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import type { ProviderAccount } from "../application/ports"
  import { usePlayback } from "./context"
  import { deviceId } from "./device-id"

  interface Props {
    account: ProviderAccount
  }

  let { account }: Props = $props()
  const { device } = usePlayback()
  let signedIn = $state<boolean | null>(null)
  let open = $state(false)
  let username = $state("")
  let password = $state("")
  let error = $state<string | null>(null)

  $effect(() => void account.signedIn().then((value) => (signedIn = value)))

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const result = await account.signIn(username, password, deviceId(device))
    password = ""
    if (!result.ok) return void (error = "Jellyfin did not accept that name and password")
    signedIn = true
    open = false
  }
</script>

{#if signedIn === false}
  {#if open}
    <!-- The token Jellyfin returns stays on this device; it is never sent to Common Ground. -->
    <form class="flex flex-wrap items-end gap-2" onsubmit={submit} aria-label="Sign in to Jellyfin">
      <div class="grid gap-1">
        <Label for="jf-user">Jellyfin user</Label>
        <Input id="jf-user" autocomplete="username" bind:value={username} required />
      </div>
      <div class="grid gap-1">
        <Label for="jf-password">Password</Label>
        <Input
          id="jf-password"
          type="password"
          autocomplete="current-password"
          bind:value={password}
        />
      </div>
      <Button type="submit" size="sm">Sign in</Button>
      {#if error}<p class="w-full text-sm text-destructive" role="alert">{error}</p>{/if}
    </form>
  {:else}
    <Button variant="outline" size="sm" onclick={() => (open = true)}>
      <LogIn aria-hidden="true" />
      Sign in to Jellyfin
    </Button>
  {/if}
{/if}
