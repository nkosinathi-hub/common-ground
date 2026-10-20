#!/usr/bin/env bash
# Rasterises public/icon.svg into the Android launcher icons. Needs ImageMagick 7 with librsvg.
# The adaptive icon's background is @color/ic_launcher_background; its foreground is the
# artwork without the green tile, centred in the 66dp safe zone of a 108dp canvas.
set -euo pipefail

res=android/app/src/main/res
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
sed -e 's/<rect[^>]*\/>//' public/icon.svg >"$tmp/art.svg"
sed 's/ rx="14"//' public/icon.svg >"$tmp/square.svg"

render() { magick -background none -density 1200 "$1" -resize "$2x$2" "${@:3}"; }

for pair in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  dpi=${pair%%:*} size=${pair##*:}
  fg=$((size * 9 / 4)) art=$((size * 3 / 2))
  render public/icon.svg "$size" "PNG32:$res/mipmap-$dpi/ic_launcher.png"
  half=$((size / 2))
  render "$tmp/square.svg" "$size" \( -size "${size}x${size}" xc:none -fill white \
    -draw "circle $half,$half $half,0" \) -compose DstIn -composite \
    "PNG32:$res/mipmap-$dpi/ic_launcher_round.png"
  render "$tmp/art.svg" "$art" -gravity center -extent "${fg}x${fg}" \
    "PNG32:$res/mipmap-$dpi/ic_launcher_foreground.png"
done
