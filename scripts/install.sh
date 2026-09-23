#!/usr/bin/env sh
set -eu

echo "Installing specloop from this checkout..."

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is not installed. Please install Node.js >= 20.19.0." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed. Please install npm (or a Node distribution that includes it)." >&2
  exit 1
fi

NODE_VERSION="$(node --version | sed 's/^v//')"
echo "Detected node v$NODE_VERSION"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
npm install
npm run build
npm install -g .

echo "Done."
echo "Try: specloop --help"
