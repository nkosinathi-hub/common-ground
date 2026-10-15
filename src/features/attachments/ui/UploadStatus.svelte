<script lang="ts">
  import { LoaderCircle, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { UploadState } from "./upload-state.svelte"

  let { upload }: { upload: UploadState } = $props()

  const label = $derived(
    upload.progress?.phase === "verifying"
      ? "Checking the file"
      : upload.progress?.phase === "uploading"
        ? "Uploading"
        : "Preparing",
  )
</script>

<div class="space-y-2 rounded-xl border p-3" aria-live="polite">
  <div class="flex items-center gap-2 text-sm">
    <LoaderCircle class="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate">{label} {upload.filename}</span>
    {#if upload.progress?.phase !== "verifying"}
      <Button size="sm" variant="ghost" onclick={() => upload.cancel()}>
        <X aria-hidden="true" />
        Cancel upload
      </Button>
    {/if}
  </div>
  <div
    class="h-1.5 overflow-hidden rounded-full bg-muted"
    role="progressbar"
    aria-label="Upload progress"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={upload.percent ?? undefined}
  >
    <div
      class="h-full rounded-full bg-primary transition-[width]"
      class:animate-pulse={upload.percent === null}
      style:width={`${upload.percent ?? 15}%`}
    ></div>
  </div>
</div>
