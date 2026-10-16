<script lang="ts">
  import { NewPasswordPage, ResetPage, SignInPage, SignUpPage, useAuth } from "@/features/auth"
  import { InvitePage, NewSpacePage } from "@/features/spaces"
  import type { Route } from "@/shared/domain"
  import AccountPage from "./pages/AccountPage.svelte"
  import InviteSignedOut from "./pages/InviteSignedOut.svelte"
  import NotFound from "./pages/NotFound.svelte"
  import PrivacyPage from "./pages/PrivacyPage.svelte"
  import SpacePage from "./SpacePage.svelte"

  interface Props {
    route: Route
    linkExpired: boolean
    signOut: () => void
    onPasswordSaved: () => void
  }

  let { route, linkExpired, signOut, onPasswordSaved }: Props = $props()
  const { session } = useAuth()
</script>

{#if route.name === "sign-in"}
  {#if linkExpired}<ResetPage expired />{:else}<SignInPage />{/if}
{:else if route.name === "sign-up"}
  <SignUpPage />
{:else if route.name === "reset"}
  <ResetPage />
{:else if route.name === "new-password"}
  <NewPasswordPage onDone={onPasswordSaved} />
{:else if route.name === "invite"}
  {#if session.user}<InvitePage token={route.token} />{:else}<InviteSignedOut />{/if}
{:else if route.name === "new-space"}
  <NewSpacePage />
{:else if route.name === "account"}
  <AccountPage {signOut} />
{:else if route.name === "privacy"}
  <PrivacyPage />
{:else if route.name === "not-found" || route.name === "entry"}
  <NotFound />
{:else if "spaceId" in route}
  <SpacePage {route} {signOut} />
{/if}
