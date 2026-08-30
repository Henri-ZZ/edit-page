#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="${ROOT_DIR%/edit-page}/edit-page-release"
MANIFEST_PATH="$ROOT_DIR/manifest.json"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "[package-release] manifest.json not found"
  exit 1
fi

VERSION="$(node -e "
  const fs = require('fs');
  const path = process.argv[1];
  const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
  const parts = String(manifest.version || '1.0.0').split('.').map(Number);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  manifest.version = parts.join('.');
  fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write(manifest.version);
" "$MANIFEST_PATH")"
ZIP_NAME="edit-page-chrome-web-store-v${VERSION}.zip"
ZIP_PATH="$RELEASE_DIR/$ZIP_NAME"

echo "[package-release] Root: $ROOT_DIR"
echo "[package-release] Version: $VERSION"
echo "[package-release] Output: $ZIP_PATH"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

cd "$ROOT_DIR"
zip -qr "$ZIP_PATH" \
  _locales \
  background \
  content \
  icons \
  offscreen \
  options \
  popup \
  license.js \
  shared.js \
  manifest.json

cp "$ZIP_PATH" "$RELEASE_DIR/edit-page-chrome-web-store.zip"

echo "[package-release] Done"
echo "[package-release] Versioned zip: $ZIP_PATH"
echo "[package-release] Latest zip: $RELEASE_DIR/edit-page-chrome-web-store.zip"
