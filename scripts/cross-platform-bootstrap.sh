#!/usr/bin/env bash
set -euo pipefail

# Cross-platform bootstrap for StarMate English SaaS
# Usage:
#   ./scripts/cross-platform-bootstrap.sh
#   ./scripts/cross-platform-bootstrap.sh android
#   ./scripts/cross-platform-bootstrap.sh ios

MODE="${1:-all}"

npm run build:web

CAP_CLI="./node_modules/@capacitor/cli/bin/capacitor"

if [ ! -x "$CAP_CLI" ]; then
  echo "Capacitor CLI binary not found at $CAP_CLI. Install @capacitor/cli first."
  exit 1
fi

if [[ "$MODE" == "ios" || "$MODE" == "all" ]]; then
  if [ ! -d "ios" ]; then
    "$CAP_CLI" add ios
  fi
fi

if [[ "$MODE" == "android" || "$MODE" == "all" ]]; then
  if [ ! -d "android" ]; then
    "$CAP_CLI" add android
  fi
fi

"$CAP_CLI" sync

echo "Bootstrap done. Use npm run mobile:open:ios or npm run mobile:open:android to open native projects."
