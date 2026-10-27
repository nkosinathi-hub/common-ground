<script lang="ts">
  import { X } from "@lucide/svelte"
  import DemoDialogBody from "./DemoDialogBody.svelte"
  interface Props {
    kind: string
    onClose: () => void
  }
  let { kind, onClose }: Props = $props()
  const titles: Record<string, string> = {
    play: "Play this episode?",
    trailer: "Trailer preview",
    event: "Plan a little time together",
    "event-detail": "Pick a film together",
    note: "Write a note",
    comment: "Add a comment",
    idea: "Start a new idea",
    invite: "Invite someone to this space",
    thread: "Conversation",
    recommend: "Recommend this title",
    notifications: "Notifications",
    account: "Ana's account",
    "note-actions": "Note options",
    member: "Ben's space access",
    setting: "Choose a setting",
    layout: "Arrange your home",
    about: "One shared space",
  }
  let isPlayer = $derived(kind === "play" || kind === "trailer")
</script>

<div
  class="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onClose()}
>
  <div
    class="w-full max-w-lg rounded-2xl border bg-background p-5 shadow-xl md:p-6"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="demo-dialog-title"
    onkeydown={(event) => event.key === "Escape" && onClose()}
  >
    <div class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <h2 id="demo-dialog-title" class="text-lg font-semibold">
          {titles[kind] ?? "Sample action"}
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
          {isPlayer
            ? "Playback isn't connected in this visual demo. The player and source choices are shown as examples."
            : kind === "invite"
              ? "In the real app, invitations are sent by email. This preview won't send anything."
              : "This preview is read-only. Nothing here will be sent or saved."}
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        aria-label="Close dialog"
        onclick={onClose}><X class="size-4" /></button
      >
    </div>
    <DemoDialogBody {kind} {onClose} />
  </div>
</div>
