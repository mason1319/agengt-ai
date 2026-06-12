# StarMate v4.1 第一阶段提交前清单（内部版）

**日期**：2026-06-12
**当前线上域名**：`https://aggieai.me` / `https://www.aggieai.me`
**最新 Cloudflare 生产部署**：`https://bfb688ed.starmate-english-saas.pages.dev`
**最新交付包**：`delivery/web/StarMate-English-Web-20260612_180153`
**latest 指针**：`delivery/web/latest -> StarMate-English-Web-20260612_180153`

## 一、建议提交范围

本次建议作为一个阶段收口提交，提交主题可用：

```text
chore: close phase1 delivery and publish cloudflare build
```

建议纳入：
- 线上发布与 Cloudflare 部署记录
- 第一阶段验收、上线证明、交付索引、签字清单与运行手册
- 学生首页到课程/练习/个人中心的跳转上下文收口
- 家长练习页只读视角
- 学生/家长只读角色不再请求 admin 文化墙接口
- `.env` 自动加载到 Cloudflare 发布脚本
- smoke、合约、AI provider 兜底、安全扫描脚本与文档更新

不建议纳入：
- `.env`
- 本地 `.wrangler` 状态
- 临时截图缓存或历史 `.tmp-*` 图片

## 二、最新验证证据

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run build`：通过
- `npm run audit:security`：通过
- `bash ./scripts/smoke-check.sh https://bfb688ed.starmate-english-saas.pages.dev`：通过（26/26）
- `bash ./scripts/smoke-check.sh https://aggieai.me`：通过（26/26）
- `bash ./scripts/smoke-check.sh https://www.aggieai.me`：通过（26/26）
- 线上浏览器点检：通过（13/13）
  - 学生首页
  - 学生课程中心
  - 学生学习练习
  - 学生个人中心
  - 家长首页
  - 家长练习只读视角
  - 移动端学生首页
  - 控制台无 error/warning/pageerror
  - 网络无 4xx/5xx/requestfailed

浏览器点检证据：
- `output/playwright/phase1-live-browser-check.json`
- `output/playwright/phase1-live-student-home.png`
- `output/playwright/phase1-live-student-courses.png`
- `output/playwright/phase1-live-student-practice.png`
- `output/playwright/phase1-live-student-profile.png`
- `output/playwright/phase1-live-parent-practice-readonly.png`
- `output/playwright/phase1-live-student-mobile.png`

## 三、已修复的发布后问题

### 只读角色文化墙 401

现象：
- 学生/家长页面加载后，浏览器控制台出现 `401 /api/v1/admin/culture-wall?role=...`。

处理：
- `src/main.jsx`：只有 `founder` / `platform` 角色传入文化墙刷新与上传函数。
- `src/services/runtimeDataService.js`：启动数据加载时，只有 `founder` / `platform` 角色请求 admin 文化墙接口。

结果：
- 学生/家长页面保留成果馆快照展示。
- 学生/家长不再触发 admin 文化墙接口。
- 线上浏览器点检确认无 4xx/5xx/requestfailed。

## 四、提交前复核命令

```bash
cd /Users/mason/英语系统
npm run lint
npm run typecheck
npm run build
npm run audit:security
bash ./scripts/smoke-check.sh https://aggieai.me
bash ./scripts/smoke-check.sh https://www.aggieai.me
```

如需要重新生成交付包：

```bash
npm run web:ship
```

如需要重新发布：

```bash
npm run cf:deploy:ensure
```

## 五、当前结论

- 第一阶段 Web/H5 内部版已经完成线上发布。
- P0/P1：当前无。
- 可进入：内部试运行、签字确认、Phase 2 排期。
- Phase 2 不应回撤第一阶段范围；新增需求应单独建任务。
