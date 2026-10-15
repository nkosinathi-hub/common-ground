import type { ExportFile } from "../application/account-service"

/** Saves a file in the browser through a temporary object URL, released straight after. */
export function downloadFile(file: ExportFile, doc: Document = document): void {
  const url = URL.createObjectURL(new Blob([file.content], { type: "application/json" }))
  const link = doc.createElement("a")
  link.href = url
  link.download = file.filename
  link.rel = "noopener"
  doc.body.append(link)
  try {
    link.click()
  } finally {
    link.remove()
    // Revoking in the same task can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
