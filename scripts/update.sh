#!/usr/bin/env bash
set -e
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SKILL_DIR"
OLD=$(git rev-parse --short HEAD)
git pull origin main --ff-only
NEW=$(git rev-parse --short HEAD)
if [ "$OLD" = "$NEW" ]; then
  echo "HAM is already up to date."
else
  echo "Updated HAM ($OLD → $NEW)"
  # Rebuild dashboard if installed
  if [ -d "dashboard/node_modules" ]; then
    cd dashboard && npm run build 2>/dev/null && echo "Dashboard rebuilt." || true
  fi
fi
