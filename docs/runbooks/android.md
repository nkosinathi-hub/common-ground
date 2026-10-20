# Android app

Common Ground on Android is the same web app inside a Capacitor 8 WebView (`android/`,
`capacitor.config.ts`, package `io.github.nkosinathihub.commonground`). It is served from
`https://localhost`; nothing in it talks to that origin except the app itself.

## Build

- `pnpm android:apk` builds a debug APK; `pnpm android:apk release` a signed one. Both run
  `vite build --mode app` (base `/`), `cap sync android`, then Gradle in the image from
  `scripts/android/Containerfile` (JDK 21, SDK 36). The host needs only Node and podman.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` come from the environment or `.env`.
  `VITE_PUBLIC_APP_URL` defaults to the website; `VITE_PUSH=on` is set when
  `android/app/google-services.json` exists.
- `pnpm android:smoke` installs a debug build on a headless emulator (needs `/dev/kvm` and the
  local stack), signs in as the demo user and expects the home page; `smoke.sh stop` ends it.
  `CG_LOCAL_STACK=1` (smoke only) allows http to the local stack and bridge logging.
- `pnpm android:show` opens a visible emulator on this desktop (X11 or XWayland) with the live
  release APK installed; `show.sh stop` closes it. It shares the host's IPC and turns off Qt's
  MIT-SHM, or the window stays grey.
- GitLab CI builds a debug APK on every change (`.gitlab/ci/android.yml`). On every push to
  `main` the GitHub Pages workflow calls `.github/workflows/apk.yml` for the signed release and
  publishes it with the site; a failed APK never blocks the site, which then ships without `app/`.

## Releases and updates

- The site serves `app/common-ground.apk` and `app/version.json` (`{"version","apk"}`) from
  `package.json`'s version (versionCode `x*10000+y*100+z`). Bump the version to ship an update.
- On start and on resume the app reads `version.json` and offers a newer APK. The CSP lets the
  app read that one file of the site and nothing else.
- First install: open `https://nkosinathi-hub.github.io/common-ground/app/common-ground.apk` on
  the phone, allow the browser to install unknown apps once, and install.

## Signing key

- The release key lives in `~/Documents/common-ground-android/` (`release.keystore`,
  `signing.env`), never in the repo. Back up both: a lost key means every phone must uninstall
  to update. SHA-256: `C1:12:C7:A5:88:7C:9E:EC:2D:A7:36:F5:E4:BC:A8:A7:92:F9:41:D1:0F:3C:C6:55:BF:66:0D:9B:4D:1C:C6:FB`.
- GitHub secrets for the Pages workflow: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
  `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_SERVICES_JSON_BASE64`.
- Google's developer verification applies to sideloaded apps worldwide from 2027: register the
  package name on a free limited-distribution account before then.

## Links

- PKCE keeps each email link's verifier where it was requested, so links go back there
  (`src/app/composition/app-address.ts`): the website's email links to the website, the app's
  to `https://nkosinathi-hub.github.io/common-ground/app-link/`. Invites carry no verifier and
  always use the app-link page.
- Android App Links claim only that page: the manifest's `autoVerify` filter for
  `/common-ground/app-link/`, verified by `https://nkosinathi-hub.github.io/.well-known/assetlinks.json`
  (repo `nkosinathi-hub/nkosinathi-hub.github.io`, release key fingerprint above). A new signing
  key means a new fingerprint there.
- Without the app, `public/app-link/` forwards to the website root with the query and hash, so
  an invite still opens on the website. An app's email link opened elsewhere reports an expired
  link, as PKCE intends.
- The production Supabase redirect allow-list must accept
  `https://nkosinathi-hub.github.io/common-ground/app-link/**` next to the website.
- `src/app/native/` maps a link to the in-app path; each link opens once per app session.

## Push

- FCM delivery: [push.md](push.md). The app asks for permission after sign-in, registers its
  token (`register_push_device`), retries on resume if saving it failed, and forgets it whenever
  the session ends (`src/app/native/push-session.ts`); on sign-out before the session ends.
- Channel `updates`, white status icon `drawable/ic_stat_notify.xml`. Tapping a push opens the
  route in its `data.route`, only when it is one of the app's routes.

## Origins

- Edge Functions see `Origin: https://localhost` from the app: `ALLOWED_ORIGINS` must list it
  next to the website (GitLab CI variable, applied by `supabase-deploy`).

## Native behaviour

- Back follows the app's history and leaves the app (minimises) from a root page.
- Data exports open the share sheet; attachments open in a browser tab; the auth session is in
  Preferences, not WebView storage. Safe areas come from `viewport-fit=cover` and `env()`.
- Fullscreen video (`PlayerChromeClient`) turns the phone to landscape and keeps the screen awake
  until fullscreen ends; the web player also holds a screen wake lock while playing. The
  emulator smoke should open a title, go fullscreen and check both (not automated yet).
