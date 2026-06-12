#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8787}"

if [ ! -x "$(command -v node)" ]; then
  echo "[FAIL] node not found"
  exit 1
fi

HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= NO_PROXY="localhost,127.0.0.1,::1" no_proxy="localhost,127.0.0.1,::1" \
  https_proxy= http_proxy= all_proxy= \
  node ./scripts/smoke-check.mjs "$BASE_URL"
