#!/usr/bin/env bash
# Rasterises the one logo (src/assets/logo.svg) into the Android launcher icons. Needs
# ImageMagick 7 with librsvg; the output is byte-identical on a rerun (no date chunks).
# The adaptive icon's background is @color/ic_launcher_background (the lime tile); its
# foreground is the mark without the tile, centred in the 66dp safe zone of a 108dp canvas; the
# monochrome layer is that mark in white for themed icons. ic_stat_notify stays a silhouette.
set -euo pipefail

src=src/assets/logo.svg
res=android/app/src/main/res
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
sed -e 's/<rect[^>]*\/>//' "$src" >"$tmp/art.svg"
sed -e 's/<rect[^>]*\/>//' -e 's/fill="#[0-9A-Fa-f]*"/fill="#FFFFFF"/g' "$src" >"$tmp/mono.svg"
sed 's/ rx="[0-9.]*"//' "$src" >"$tmp/square.svg"

render() {
  magick -background none -density 1200 "$1" -resize "$2x$2" "${@:3:$#-3}" \
    -define png:exclude-chunks=date,time "${@: -1}"
}

for pair in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  dpi=${pair%%:*} size=${pair##*:}
  fg=$((size * 9 / 4)) art=$((size * 3 / 2)) half=$((size / 2))
  render "$src" "$size" "PNG32:$res/mipmap-$dpi/ic_launcher.png"
  render "$tmp/square.svg" "$size" \( -size "${size}x${size}" xc:none -fill white \
    -draw "circle $half,$half $half,0" \) -compose DstIn -composite \
    "PNG32:$res/mipmap-$dpi/ic_launcher_round.png"
  render "$tmp/art.svg" "$art" -gravity center -extent "${fg}x${fg}" \
    "PNG32:$res/mipmap-$dpi/ic_launcher_foreground.png"
  render "$tmp/mono.svg" "$art" -gravity center -extent "${fg}x${fg}" \
    "PNG32:$res/mipmap-$dpi/ic_launcher_monochrome.png"
done
# The splash shows the mark on the tile colour (drawable/splash.xml), 160dp at xxxhdpi.
render "$tmp/art.svg" 432 "PNG32:$res/drawable/splash_icon.png"
