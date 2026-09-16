#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🎨 1. Ensuring game icons are generated..."
if [ ! -f "assets/icon.icns" ]; then
  chmod +x assets/generate_icons.sh
  ./assets/generate_icons.sh
fi

echo "📦 2. Building React TypeScript frontend..."
cd client && npm run build && cd ..

echo "🔨 3. Bundling single standalone binary with PyInstaller..."
PYINSTALLER_CONFIG_DIR="$PWD/.pyinstaller_cache" poetry run pyinstaller --noconfirm --onefile \
  --name imposter-party \
  --icon "assets/icon.icns" \
  --add-data "client/dist:client/dist" \
  --add-data "backend/words:backend/words" \
  --hidden-import "uvicorn.logging" \
  --hidden-import "uvicorn.loops" \
  --hidden-import "uvicorn.loops.auto" \
  --hidden-import "uvicorn.protocols" \
  --hidden-import "uvicorn.protocols.http" \
  --hidden-import "uvicorn.protocols.http.auto" \
  --hidden-import "uvicorn.protocols.websockets" \
  --hidden-import "uvicorn.protocols.websockets.auto" \
  backend/main.py

echo "=================================================="
echo "🎉 Standalone executable ready: dist/imposter-party"
echo "=================================================="
