#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$ROOT_DIR/dist"
MANIFEST_PATH="$ROOT_DIR/manifest.json"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "[package-release] manifest.json not found"
  exit 1
fi

VERSION="$(node -e "
  const fs = require('fs');
  const path = process.argv[1];
  const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (!manifest.version) {
    console.error('[package-release] manifest.json version is missing');
    process.exit(1);
  }
  process.stdout.write(String(manifest.version));
" "$MANIFEST_PATH")"
ZIP_NAME="editpage-${VERSION}.zip"
ZIP_PATH="$RELEASE_DIR/$ZIP_NAME"

echo "[package-release] Root: $ROOT_DIR"
echo "[package-release] Version: $VERSION"
echo "[package-release] Output: $ZIP_PATH"

mkdir -p "$RELEASE_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -qr "$ZIP_PATH" \
  _locales \
  assets \
  background \
  content \
  icons \
  offscreen \
  options \
  popup \
  public \
  license.js \
  shared.js \
  manifest.json

echo "[package-release] Done"
echo "[package-release] Zip: $ZIP_PATH"
