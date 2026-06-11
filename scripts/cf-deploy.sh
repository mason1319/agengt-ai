#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAME=${CLOUDFLARE_PAGES_PROJECT:-starmate-english-saas}
DEPL_DIR=${1:-dist}

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "缺少环境变量: CLOUDFLARE_API_TOKEN"
  echo "请先设置："
  echo "  export CLOUDFLARE_API_TOKEN=<你的 Cloudflare API Token>"
  echo "或者临时运行："
  echo "  CLOUD_TOKEN=<token> CLOUDFLARE_API_TOKEN=\$CLOUD_TOKEN npm run cf:deploy:ensure"
  exit 1
fi

echo "开始构建并部署到 Cloudflare Pages..."
npm run web:build
wrangler pages deploy "$DEPL_DIR" --project-name "$PROJECT_NAME" --commit-dirty=true
