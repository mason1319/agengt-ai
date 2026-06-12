#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DIST_DIR="dist"
OUT_DIR="delivery/web"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_NAME="StarMate-English-Web-${TIMESTAMP}"
TARGET_DIR="${OUT_DIR}/${ARCHIVE_NAME}"
LATEST_DIR="${OUT_DIR}/latest"

mkdir -p "$OUT_DIR"

echo "开始构建网页产物..."
npm run web:build
BUILD_TIME="$(date '+%F %T %z')"

if [ ! -d "$DIST_DIR" ]; then
  echo "构建失败：未生成 ${DIST_DIR} 目录"
  exit 1
fi

rm -rf "$TARGET_DIR"
cp -R "$DIST_DIR" "$TARGET_DIR"
mkdir -p "${TARGET_DIR}/delivery-docs"

cat > "${TARGET_DIR}/验收签字单-待填写.md" <<EOF
StarMate English 网页版交付签收单（待填）
交付时间：${BUILD_TIME}
交付目录：${TARGET_DIR}
版本标识：${ARCHIVE_NAME}
交付方式：npm run web:ship
EOF

cat docs/web-delivery-signoff-template.md >> "${TARGET_DIR}/验收签字单-待填写.md"

cat > "${TARGET_DIR}/.delivery-note.txt" <<EOF
StarMate English 网页原型交付包
构建时间: ${BUILD_TIME}
构建命令: npm run web:build
技术栈: React + Vite
说明: 当前聚焦网页上线闭环（含真实登录与数据库落库）
EOF

cat > "${TARGET_DIR}/README.txt" <<'EOF'
交付包用途：网页版原型验收（Phase 1）
包含内容：
1) index.html 与静态资源（dist 产物）
2) .delivery-note.txt（时间/构建信息）

部署建议：
- 上传到 Cloudflare Pages 后作为静态站点发布
- 当前仅网页端演示；iOS/Android/小程序为后续阶段（保留可迁移路径）

验收点位：
- 角色切换可点且视图变化：创始人 / 老师 / 家长 / 学生 / 平台
- 无横向溢出：手机宽度可完整展示
- 创始人：续费预警、经营指标、试听线索
- 老师：授权学生、一键消课、客户信息脱敏
- 平台：试用到期、套餐切换、AI 用量与上限
- 首页：AI 感、明亮风格、非传统培训机构风格
EOF

cp docs/web-delivery-checklist.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-screenshot-guide.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-requirement-map.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-signoff-template.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-client-note.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-runbook.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-summary.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-delivery-index.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-to-customer-message.md "${TARGET_DIR}/delivery-docs/"
cp docs/web-delivery-ready-to-send.md "${TARGET_DIR}/delivery-docs/"

cat > "${TARGET_DIR}/delivery-docs/README-THIS-PACKAGE.txt" <<EOF
版本目录：${ARCHIVE_NAME}
更新时间：${BUILD_TIME}
一句话用途：第一阶段网页原型交付（仅网页）
一条命令交付：npm run web:ship
EOF

ln -sfn "$ARCHIVE_NAME" "$LATEST_DIR"

echo "网页交付包已生成：${TARGET_DIR}"
echo "最新包链接：${LATEST_DIR}"
