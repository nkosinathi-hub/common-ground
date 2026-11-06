#!/usr/bin/env bash
# Regenerate the original, silent sample clip. Contains no third-party film or television media.
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
codec=libx264
if ! ffmpeg -hide_banner -encoders 2>/dev/null | rg libx264 >/dev/null; then codec=libopenh264; fi
mkdir -p "$root/public/demo"
ffmpeg -loglevel error -y -f lavfi -i 'color=c=0x10231b:s=640x360:r=12:d=30' \
  -vf "drawbox=x=48:y=48:w=544:h=264:color=0x275b43:t=fill,drawtext=text='Common Ground':fontcolor=white:fontsize=36:x=(w-tw)/2:y=h/2-30,drawtext=text='Player preview':fontcolor=0xc6d7cc:fontsize=18:x=(w-tw)/2:y=h/2+25,fade=t=in:st=0:d=1" \
  -c:v "$codec" -pix_fmt yuv420p -g 24 -an -movflags +faststart "$root/public/demo/preview.mp4"
