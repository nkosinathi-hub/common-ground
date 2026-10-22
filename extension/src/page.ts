import { installSeekHandler } from "./page-seek"

// The MAIN-world script: it alone can reach Netflix's page player API, and it does one thing
// with it, seek, when the content script asks over the bridge (bridge.ts).
installSeekHandler(window)
