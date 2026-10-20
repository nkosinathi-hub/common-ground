import { Directory, Encoding, Filesystem } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import type { ExportFile } from "../application/account-service"

/** Android cannot download a blob from the WebView: save it to the cache and share it instead. */
export async function shareFile(file: ExportFile): Promise<void> {
  const { uri } = await Filesystem.writeFile({
    path: file.filename,
    data: file.content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  try {
    await Share.share({ title: file.filename, files: [uri] })
  } catch {
    // Closing the share sheet rejects; the file is already saved, so there is nothing to report.
  }
}
