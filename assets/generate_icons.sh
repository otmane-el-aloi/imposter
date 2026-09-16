#!/usr/bin/env bash
set -e

SOURCE_IMG="${1:-assets/option_a_shadow_imposter.jpg}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🎨 Generating icons from: $SOURCE_IMG"
mkdir -p assets client/public

# 1. Base 1024x1024 PNG
sips -s format png "$SOURCE_IMG" --out assets/icon.png >/dev/null

# 2. Build macOS .icns using iconutil
ICONSET="assets/icon.iconset"
rm -rf "$ICONSET"
mkdir -p "$ICONSET"

sips -z 16 16     assets/icon.png --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32     assets/icon.png --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32     assets/icon.png --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64     assets/icon.png --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128   assets/icon.png --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256   assets/icon.png --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256   assets/icon.png --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512   assets/icon.png --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512   assets/icon.png --out "$ICONSET/icon_512x512.png" >/dev/null
sips -z 1024 1024 assets/icon.png --out "$ICONSET/icon_512x512@2x.png" >/dev/null

iconutil -c icns "$ICONSET" -o assets/icon.icns
rm -rf "$ICONSET"

# 3. Web favicon & logo
cp assets/icon.png client/public/logo.png
sips -z 64 64 assets/icon.png --out client/public/favicon.png >/dev/null

echo "✅ Generated assets/icon.icns, assets/icon.png, and client/public/favicon.png"
