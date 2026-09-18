#!/usr/bin/env bash
# Single entry point for the whole build, run by Render (and usable locally).
# Kept as a real script (not an inline multi-line YAML string) so there is
# zero ambiguity about quoting/newlines when Render parses render.yaml.
set -euo pipefail

echo "== Building frontend =="
cd frontend
npm install
npm run build
cd ..

echo "== Installing backend deps =="
cd backend
npm install

echo "== Copying frontend build into backend/public =="
rm -rf public
cp -r ../frontend/dist public

echo "== Build complete =="
