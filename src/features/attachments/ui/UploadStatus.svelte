<script lang="ts">
  import { LoaderCircle, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { UploadPhase } from "../domain/types"
  import type { UploadState } from "./upload-state.svelte"

  interface Props {
    upload: UploadState
  }
  let { upload }: Props = $props()

  const LABELS: Record<UploadPhase, string> = {
    starting: "Preparing",
    uploading: "Uploading",
    verifying: "Checking the file",
  }
  const label = $derived(LABELS[upload.progress?.phase ?? "starting"])
  // Width of the pulsing bar while no bytes have been counted yet.
  const PENDING_PERCENT = 15
</script>

<div class="flex flex-col gap-related rounded-lg border p-item" aria-live="polite">
  <div class="flex items-center gap-related type-sm">
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
      style:width={`${upload.percent ?? PENDING_PERCENT}%`}
    ></div>
  </div>
</div>
