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
- GitLab CI builds a debug APK on every change (`.gitlab/ci/android.yml`). The GitHub Pages
  workflow builds the signed release on every push to `main` and publishes it with the site.

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

- Email links (sign-up, password reset) and invite links name the website
  (`src/app/composition/app-address.ts`), so they work with or without the app.
- Android App Links open them in the app: the manifest's `autoVerify` filter for
  `/common-ground`, verified by `https://nkosinathi-hub.github.io/.well-known/assetlinks.json`
  (repo `nkosinathi-hub/nkosinathi-hub.github.io`, release key fingerprint above). A new signing
  key means a new fingerprint there.
- `src/app/native/` maps a link to the in-app path; each link opens once per app session.

## Push

- FCM delivery: [push.md](push.md). The app asks for permission after sign-in, registers its
  token (`register_push_device`), and removes it on sign-out before the session ends.
- Channel `updates`, white status icon `drawable/ic_stat_notify.xml`. Tapping a push opens the
  route in its `data.route`, only when it is one of the app's routes.

## Origins

- Edge Functions see `Origin: https://localhost` from the app: `ALLOWED_ORIGINS` must list it
  next to the website (GitLab CI variable, applied by `supabase-deploy`).

## Native behaviour

- Back follows the app's history and leaves the app (minimises) from a root page.
- Data exports open the share sheet; attachments open in a browser tab; the auth session is in
  Preferences, not WebView storage. Safe areas come from `viewport-fit=cover` and `env()`.
