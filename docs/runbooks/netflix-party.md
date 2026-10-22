# Netflix watch party (browser extension)

A Netflix party (#66) plays a title in sync on netflix.com. Each of you streams it from your
own Netflix account; the Common Ground extension only reads and drives your own Netflix player
(play, pause, seek, playback rate), as Teleparty does. It never downloads, captures, records,
re-streams or proxies anything, and never touches Netflix's media requests or decryption.

Code: `extension/` (MV3: Chrome and Edge 111+, Firefox 140+). It bundles the app's own
`src/features/parties` sync engine and party channel; nothing is copied.

## Install (each of you, on a desktop)

1. Download `app/common-ground-extension.zip` from the site (next to the APK) and unzip it, or
   build it: `pnpm extension:build` writes `extension/dist` and
   `extension/common-ground-extension.zip` (it needs `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`, as the app build does).
2. Chrome or Edge: open `chrome://extensions` (`edge://extensions`), turn on Developer mode,
   choose Load unpacked and pick the unzipped folder (or `extension/dist`).
   Firefox: install the signed `app/common-ground-extension.xpi` from the site. Unsigned
   (`common-ground-extension-firefox.zip`), load it in `about:debugging#/runtime/this-firefox`
   with Load Temporary Add-on; it lasts until Firefox restarts. Signing: `web-ext sign
--channel=unlisted` with an addons.mozilla.org API key; the add-on id is fixed in
   `extension/manifest.ts`, so each signed version updates the last.
3. Click the Common Ground icon and sign in with your Common Ground email and password.

## Watch

1. In the app, open the title, Watch together, and pick "On Netflix (with the Common Ground
   extension)". The party page is the lobby and the remote; a phone works as the remote.
2. Each of you joins the party in the extension popup, then opens the title on netflix.com
   (the party page and the popup link to a plain netflix.com search for it).
3. Start the episode on Netflix, then press Ready in the small Common Ground panel on the
   right. Ready is a click on the page, which lets the extension start the video.
4. When everyone with the extension is ready, the host presses Play together (in the panel or
   on the party page). Play is scheduled a moment ahead so everyone starts at once.
5. Pause and resume from the panel or the party page. Drift is corrected by nudging the rate
   and, past 4 seconds, a seek through Netflix's own player. "We finished" in the app credits
   everyone who confirmed, and moves together progress as for any party.

If nobody has the extension connected, the party page falls back to the co-watch: a shared
3-2-1 and pause signal, and each of you presses play yourselves.

## Permissions

`storage` (your Common Ground session and the joined party), and host access to
`https://www.netflix.com/*` and the build's Supabase origin only. No `<all_urls>`, no tabs or
history. The extension pages keep the MV3 CSP (`script-src 'self'`): no remote code.

## Limits

- Desktop Chrome, Edge and Firefox only (`web-ext lint` is clean). Phones are remotes: Netflix's own apps (phone, TV) cannot be
  controlled.
- Pausing or seeking with Netflix's own controls is not shared; use the panel or the app.
- Netflix may change its page player API; then seeking fails and the panel says to reload. The
  check is in `extension/src/page-seek.ts`.
- Each of you needs your own Netflix account, and the title must be available in each region.
