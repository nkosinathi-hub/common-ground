#!/usr/bin/env bash
# Regenerates the tiny playback fixtures (one second, 64x36, mono): an MP4, an HLS rendition
# and a DASH rendition. Uses a local ffmpeg, or ffmpeg in a container when none is installed.
set -euo pipefail
out="$(cd "$(dirname "$0")/../.." && pwd)/tests/fixtures/playback"
mkdir -p "$out/hls" "$out/dash"

run_ffmpeg() {
  if command -v ffmpeg >/dev/null; then
    (cd "$out" && ffmpeg -loglevel error -y "$@")
  else
    podman run --rm -v "$out:/out:z" -w /out docker.io/linuxserver/ffmpeg:7.1.1 \
      -loglevel error -y "$@"
  fi
}

# Fedora's ffmpeg ships OpenH264 rather than x264; the container has x264.
h264=libx264
if command -v ffmpeg >/dev/null && ! ffmpeg -hide_banner -encoders | grep -q libx264; then
  h264=libopenh264
fi

input=(-f lavfi -i "testsrc=size=64x36:rate=10:duration=1"
  -f lavfi -i "sine=frequency=440:duration=1"
  -c:v "$h264" -pix_fmt yuv420p -g 10
  -c:a aac -b:a 16k -ac 1 -ar 22050)

run_ffmpeg "${input[@]}" -movflags +faststart sample.mp4
run_ffmpeg "${input[@]}" -f hls -hls_time 1 -hls_playlist_type vod -hls_segment_type fmp4 \
  -hls_fmp4_init_filename init.mp4 -hls_segment_filename "hls/seg%d.m4s" hls/index.m3u8
run_ffmpeg "${input[@]}" -f dash -seg_duration 1 -use_template 1 -use_timeline 0 \
  -init_seg_name 'init-$RepresentationID$.m4s' \
  -media_seg_name 'chunk-$RepresentationID$-$Number$.m4s' dash/manifest.mpd
du -sh "$out"
