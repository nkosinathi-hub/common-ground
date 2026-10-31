/** Whether the one capture dialog is open; any capture button, or the Ideas FAB, opens it. */
export const captureRequest = $state({ open: false })

export function openCapture(): void {
  captureRequest.open = true
}
