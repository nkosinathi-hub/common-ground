<script lang="ts">
  import { Shield } from "@lucide/svelte"
  import {
    AppearanceCard,
    DataExportCard,
    DeleteAccountCard,
    PasswordCard,
    ProfileCard,
  } from "@/features/account"
  import { useAuth } from "@/features/auth"
  import { useSpaces } from "@/features/spaces"
  import { toast } from "@/shared/ui"

  interface Props {
    signOut: () => void
  }

  let { signOut }: Props = $props()
  const { session } = useAuth()
  const { store } = useSpaces()
  const spaces = $derived(store.spaces.map((s) => ({ id: s.id, name: s.name })))

  function deleted() {
    toast.success("Your account was deleted")
    signOut()
  }
</script>

<main class="mx-auto grid max-w-2xl gap-6 px-4 py-10">
  <div class="grid gap-1">
    <h1 class="text-2xl font-semibold">Account and data</h1>
    <a href="#/privacy" class="flex w-fit items-center gap-1 text-sm text-primary hover:underline">
      <Shield class="size-4" aria-hidden="true" /> How we handle your data
    </a>
  </div>
  {#if session.user}
    <ProfileCard userId={session.user.id} displayName={session.user.displayName} />
    <AppearanceCard />
    <PasswordCard />
    <DataExportCard {spaces} />
    <DeleteAccountCard onDeleted={deleted} />
  {/if}
</main>
