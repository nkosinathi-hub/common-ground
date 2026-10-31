<script lang="ts">
  import { AppearanceCard, PasswordCard, ProfileCard, SessionsCard } from "@/features/account"

  interface Props {
    userId: string
    displayName: string
    signOutEverywhere: () => void
  }

  let { userId, displayName, signOutEverywhere }: Props = $props()
</script>

<!-- Figma D18a: name and password on the left, this device and every device on the right. -->
<div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
  <div class="flex flex-col gap-columns">
    <ProfileCard {userId} {displayName} />
    <PasswordCard />
  </div>
  <div class="flex flex-col gap-columns">
    <AppearanceCard compact />
    <SessionsCard onSignOutEverywhere={signOutEverywhere} />
  </div>
</div>
