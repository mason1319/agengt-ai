#!/usr/bin/env bash
set -euo pipefail

# Raise the soft limit when possible so Wrangler file watching does not fail
# early on large worktrees.
if command -v ulimit >/dev/null 2>&1; then
  current_limit="$(ulimit -n 2>/dev/null || echo "")"
  if [ -n "$current_limit" ] && [ "$current_limit" != "unlimited" ] && [ "$current_limit" -lt 65536 ] 2>/dev/null; then
    ulimit -n 65536 || true
  fi
fi

# Some shells or IDEs inject inspector flags globally, which collides with
# Wrangler's own dev session port binding.
case "${NODE_OPTIONS:-}" in
  *--inspect*|*--inspect-brk*)
    unset NODE_OPTIONS
    ;;
esac

PORT="${STARMATE_CF_PORT:-8787}"
INSPECTOR_PORT="${WRANGLER_INSPECTOR_PORT:-9230}"

npx wrangler pages dev dist \
  --port "$PORT" \
  --inspector-port "$INSPECTOR_PORT" \
  --log-level warn \
  --show-interactive-dev-session=false
