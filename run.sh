#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=================================================="
echo "  🕵️‍♂️  Starting Imposter Local Multiplayer Game   "
echo "=================================================="

# Check if client/dist exists; if not, build it
if [ ! -d "client/dist" ]; then
  echo "📦 Building web client..."
  cd client
  npm install
  npm run build
  cd ..
fi

echo "🚀 Starting FastAPI server on 0.0.0.0:8000..."
poetry run python -m backend.main
