#!/usr/bin/env bash
# Prints the APK version from package.json as env lines: x.y.z and a code of x*10000+y*100+z.
set -euo pipefail
version=$(node -p 'require("./package.json").version')
IFS=. read -r major minor patch <<<"$version"
echo "CG_VERSION_NAME=$version"
echo "CG_VERSION_CODE=$((major * 10000 + minor * 100 + patch))"
