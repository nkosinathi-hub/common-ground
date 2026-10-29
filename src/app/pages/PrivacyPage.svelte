<script lang="ts">
  interface Props {
    /** Inside the app shell, which owns the page's main landmark. */
    framed?: boolean
  }

  let { framed = false }: Props = $props()
</script>

<svelte:element
  this={framed ? "div" : "main"}
  class="prose-sm mx-auto grid max-w-2xl gap-4 px-4 py-10"
>
  {#if !framed}<a href="#/" class="text-sm text-primary hover:underline">Back</a>{/if}
  <h1 class="text-2xl font-semibold">Privacy</h1>
  <p>
    Common Ground is a private space for you and the people you invite. This notice explains what we
    keep, in line with South Africa's Protection of Personal Information Act (POPIA).
  </p>
  <h2 class="text-lg font-semibold">What we store</h2>
  <ul class="list-disc pl-5">
    <li>
      Your email address and password (hashed) for signing in. Other members never see your email.
    </li>
    <li>Your display name, shown only to members of spaces you belong to.</li>
    <li>
      What you add: titles, progress, likes and dislikes, comments, ideas, tasks, budgets and files.
    </li>
  </ul>
  <h2 class="text-lg font-semibold">Who can see it</h2>
  <p>
    Only current members of the space it belongs to. Removed members lose access immediately. There
    are no public profiles, no advertising and no analytics trackers.
  </p>
  <h2 class="text-lg font-semibold">Third parties</h2>
  <p>
    Data is hosted by Supabase. Title search and streaming availability come from TMDB and
    JustWatch; your searches are sent to TMDB through our server without your identity. If you
    connect Simkl, we keep only the access keys it gives us, read your Simkl watch history to tick
    titles on your lists, and send Simkl nothing. Disconnecting revokes and deletes them.
  </p>
  <h2 class="text-lg font-semibold">Your rights</h2>
  <p>
    From Account and data you can download everything about you, download a space's content, and
    delete your account. Deleting your account removes your personal information; content you wrote
    in shared spaces stays, credited to "Former member". If you leave or are removed from a space,
    what you wrote there shows your name only to people who still share another space with you.
  </p>
  <h2 class="text-lg font-semibold">Exporting your data</h2>
  <ul class="list-disc pl-5">
    <li>
      "Download my data" gives you a JSON file with your profile, your sign-in email, the spaces you
      belong to and how much you have added to each kind of content.
    </li>
    <li>
      Any member can export a space they belong to: its details, the members' display names and
      everything added there. Exports never include invite links, notifications or file download
      links, and nobody else's email address.
    </li>
  </ul>
  <h2 class="text-lg font-semibold">Deleting your account</h2>
  <ul class="list-disc pl-5">
    <li>You confirm with your password and by typing DELETE. It cannot be undone.</li>
    <li>
      If you own a space other people still belong to, make someone else the owner or delete that
      space first. Spaces where you are the only member are deleted with your account.
    </li>
    <li>
      Your profile, sign-in details and memberships are removed straight away. What you wrote in
      shared spaces stays for the other members, without your name.
    </li>
  </ul>
</svelte:element>
