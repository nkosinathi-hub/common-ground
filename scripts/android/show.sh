#!/usr/bin/env bash
# Opens a visible Android emulator on this desktop (X11 or XWayland) with the live release
# APK from the website installed. `show.sh stop` closes it.
set -euo pipefail

name=cg-android-view
image=localhost/common-ground-emulator:36
adb() { podman exec "$name" adb "$@"; }
[ "${1:-}" = stop ] && { podman rm -f "$name" >/dev/null; exit 0; }

podman image exists "$image" ||
  podman build -t "$image" -f scripts/android/Containerfile.emulator scripts/android
if podman container exists "$name"; then podman start "$name" >/dev/null; else podman run -d --name "$name" --network host \
  --device /dev/kvm --security-opt label=disable --ipc=host -e QT_X11_NO_MITSHM=1 \
  -e DISPLAY="${DISPLAY:-:0}" \
  -e XAUTHORITY=/root/.Xauthority -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v "${XAUTHORITY:?needs an X display}:/root/.Xauthority:ro" "$image" \
  emulator -avd smoke -no-audio -no-snapshot -no-boot-anim -gpu swangle_indirect >/dev/null; fi
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 3; done

apk=$(mktemp --suffix=.apk)
trap 'rm -f "$apk"' EXIT
curl -fsSL -o "$apk" https://nkosinathi-hub.github.io/common-ground/app/common-ground.apk
podman cp "$apk" "$name":/tmp/app.apk
# A build signed with another key (a debug build) must go first: Android refuses to replace it.
adb install -r /tmp/app.apk >/dev/null 2>&1 || {
  adb uninstall io.github.nkosinathihub.commonground >/dev/null
  adb install /tmp/app.apk >/dev/null
}
adb shell am start -n io.github.nkosinathihub.commonground/.MainActivity >/dev/null
echo "show: Common Ground is open in the emulator window"
