#!/usr/bin/env bash
# Rasterises public/icon.svg into the PNG app icons the manifest and index.html reference.
# Needs ImageMagick 7 with librsvg. Run from the repo root after changing icon.svg.
set -euo pipefail

src=public/icon.svg
out=public
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Full-bleed square: the platform applies its own mask (maskable) or rounding (Apple).
sed 's/ rx="14"//' "$src" >"$tmp/square.svg"

render() { magick -background none -density 1200 "$1" -resize "$2x$2" "${@:3}"; }

render "$src" 192 "PNG32:$out/icon-192.png"
render "$src" 512 "PNG32:$out/icon-512.png"
render "$tmp/square.svg" 512 "PNG32:$out/icon-maskable-512.png"
render "$tmp/square.svg" 180 -background '#526b4a' -alpha remove -alpha off \
  "PNG24:$out/apple-touch-icon.png"
