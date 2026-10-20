#!/usr/bin/env bash
# Builds the Android APK: the web app in `app` mode, `cap sync`, then Gradle inside the
# build image (scripts/android/Containerfile), so the host needs only Node and podman.
# Usage: scripts/android/build.sh [debug|release]
# A release needs CG_KEYSTORE_FILE (host path), CG_KEYSTORE_PASSWORD, CG_KEY_ALIAS and
# CG_KEY_PASSWORD (docs/runbooks/android.md); VITE_* comes from the environment or .env.
set -euo pipefail

type=${1:-debug}
image=localhost/common-ground-android:36
task=$([ "$type" = release ] && echo assembleRelease || echo assembleDebug)
keystore=()
if [ "$type" = release ]; then
  keystore=(-v "${CG_KEYSTORE_FILE:?release builds need CG_KEYSTORE_FILE}:/keystore:ro,z"
    -e CG_KEYSTORE_FILE=/keystore -e CG_KEYSTORE_PASSWORD -e CG_KEY_ALIAS -e CG_KEY_PASSWORD)
fi

podman image exists "$image" ||
  podman build -t "$image" -f scripts/android/Containerfile scripts/android

export VITE_PUBLIC_APP_URL=${VITE_PUBLIC_APP_URL:-https://nkosinathi-hub.github.io/common-ground/}
# Push needs Firebase's client config; without it the app runs with push switched off.
if [ -s android/app/google-services.json ]; then export VITE_PUSH=on; fi
pnpm exec vite build --mode app
pnpm exec cap sync android

podman run --rm -v "$PWD:/app:z" -w /app/android -v common-ground-gradle:/root/.gradle -v common-ground-android-home:/root/.android \
  --env-file <(bash scripts/android/version.sh) \
  "${keystore[@]}" "$image" ./gradlew --no-daemon -q "$task"

ls android/app/build/outputs/apk/"$type"/*.apk
