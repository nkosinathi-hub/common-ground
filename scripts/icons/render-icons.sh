#!/usr/bin/env bash
# Rasterises the one logo (src/assets/logo.svg, the Figma Logo 216:7026) into the web app icons
# the manifest and index.html reference, and copies it to public/icon.svg for the favicon.
# Needs ImageMagick 7 with librsvg. Run from the repo root after changing the logo; the output
# is byte-identical on a rerun (no date chunks).
set -euo pipefail

src=src/assets/logo.svg
out=public
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cp "$src" "$out/icon.svg"

# Full-bleed square: the platform applies its own mask (maskable) or rounding (Apple).
sed 's/ rx="[0-9.]*"//' "$src" >"$tmp/square.svg"

render() {
  magick -background none -density 1200 "$1" -resize "$2x$2" "${@:3:$#-3}" \
    -define png:exclude-chunks=date,time "${@: -1}"
}

render "$src" 192 "PNG32:$out/icon-192.png"
render "$src" 512 "PNG32:$out/icon-512.png"
render "$tmp/square.svg" 512 "PNG32:$out/icon-maskable-512.png"
render "$tmp/square.svg" 180 -background '#c7f268' -alpha remove -alpha off \
  "PNG24:$out/apple-touch-icon.png"
