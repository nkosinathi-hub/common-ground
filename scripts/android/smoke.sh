#!/usr/bin/env bash
# Emulator smoke test: a debug APK against the local Supabase stack, on a headless Pixel 7
# (API 36) in scripts/android/Containerfile.emulator. Needs /dev/kvm and `supabase start`.
# Leaves the emulator running as container cg-android-smoke; `smoke.sh stop` removes it.
set -euo pipefail

name=cg-android-smoke
image=localhost/common-ground-emulator:36
adb() { podman exec "$name" adb "$@"; }
[ "${1:-}" = stop ] && { podman rm -f "$name" >/dev/null; exit 0; }

podman image exists "$image" ||
  podman build -t "$image" -f scripts/android/Containerfile.emulator scripts/android

# 10.0.2.2 is the emulator's name for the host; the container shares the host network.
anon=$(pnpm -s exec supabase status -o env 2>/dev/null | sed -n 's/^ANON_KEY="\(.*\)"$/\1/p')
CG_LOCAL_STACK=1 VITE_SUPABASE_URL=http://10.0.2.2:54321 VITE_SUPABASE_ANON_KEY="$anon" \
  bash scripts/android/build.sh debug

podman container exists "$name" || podman run -d --name "$name" --network host \
  --device /dev/kvm "$image" emulator -avd smoke -no-window -no-audio -no-snapshot \
  -no-boot-anim -gpu swangle_indirect >/dev/null
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 2; done

podman cp android/app/build/outputs/apk/debug/app-debug.apk "$name":/tmp/app.apk
adb install -r -g /tmp/app.apk >/dev/null
adb shell am start -W -n io.github.nkosinathihub.commonground/.MainActivity >/dev/null

# Signs in as the seeded demo user and expects her home page (docs/runbooks/setup.md).
screen() { adb exec-out uiautomator dump /dev/stdout 2>/dev/null; }
wait_for() {
  for _ in $(seq 30); do screen | grep -q "$1" && return 0; sleep 2; done
  echo "smoke: never saw \"$1\"" >&2 && return 1
}
wait_for 'Welcome back'
field=$(screen | grep -o 'class="android.widget.EditText"[^>]*bounds="[^"]*"' | head -1 |
  sed 's/.*bounds="\[\([0-9]*\),\([0-9]*\)\]\[\([0-9]*\),\([0-9]*\)\]"/\1 \2 \3 \4/')
read -r x1 y1 x2 y2 <<<"$field"
adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
adb shell input text ana@demo.local && adb shell input keyevent 61
adb shell input text demo-password-ana && adb shell input keyevent 66
wait_for 'Notes for you'
echo "smoke: signed in on $name"
