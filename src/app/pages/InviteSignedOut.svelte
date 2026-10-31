<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { buildHash } from "@/shared/domain"
  import { AuthCard, PublicLayout, TextLink } from "@/shared/ui"
</script>

<!-- No frame: an invitation opened signed out, on the sign-in layout (D21). -->
<PublicLayout hero="Good things have a place here.">
  <AuthCard
    title="You have been invited"
    description="Sign in or create an account to see and accept this invitation. We will bring you back here."
  >
    <Button href={buildHash({ name: "sign-in" })}>Sign in</Button>
    {#snippet footer()}
      New here? <TextLink href={buildHash({ name: "sign-up" })}>Create an account</TextLink>
    {/snippet}
  </AuthCard>
</PublicLayout>
