# StarMate v4.1 内部版 第1阶段最终交付索引

## 1. 版本与范围
- 版本：v4.1（内部机构自用版）
- 范围：Web/H5 内部可用版本（不含公开付费 SaaS 商业化、App/小程序正式发行）
- 主要文档源：
  - [docs/phase1-prd-starmate-english.md](/Users/mason/英语系统/docs/phase1-prd-starmate-english.md)
  - [docs/StarMate-PRD-v4.1-internal-CN.md](/Users/mason/英语系统/docs/StarMate-PRD-v4.1-internal-CN.md)

## 2. 关键验收结论
- 验收状态：Phase 1 闭环通过（适合内部签字与上线试用）
- 阻断项：P0 无 / P1 无
- 当前建议：进入内部试用，P2 优化不阻塞验收

## 3. 代码与接口门禁
- `npm run validate:contracts`
- `npm run stack:verify`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run audit:dead-code`
- `npm run audit:deps`
- `npm run audit:security`
- 浏览器渲染检查：学生页关键内容、家长练习只读视角

> 历史执行记录见 `docs/phase1-closeout-report-v4.1-internal-CN.md`。

## 4. 上线与交付产物
- 线上部署：
  - 域名：`https://aggieai.me`
  - 域名：`https://www.aggieai.me`
  - 最新生产部署：`https://bfb688ed.starmate-english-saas.pages.dev`
- 交付包：
  - 目录：`delivery/web/latest`
  - 说明文件：`delivery/web/latest/README.txt`
  - 验收签字单：`delivery/web/latest/验收签字单-待填写.md`
  - 上线公告：`delivery/web/latest/上线验收公告-v4.1.md`
  - 对外提交模板：`delivery/web/latest/对外提交模板-v4.1.md`

## 5. 验收链路（五角色）
- 登录与会话：`POST /api/v1/auth/login`、`GET /api/v1/me`
- 公开咨询：`GET /api/v1/public/courses`、`POST /api/v1/public/leads`、`POST /api/v1/public/trial-bookings`、`POST /api/v1/public/leads/{leadId}/ai-reply`
- 学生：`GET /api/v1/student/today-path`、`POST /api/v1/student/voice-practice/assess`、`GET /api/v1/student/review/*`、`GET /api/v1/student/lesson-account`
- 老师：`GET /api/v1/teacher/students`、`GET /api/v1/teacher/exceptions`、`GET /api/v1/teacher/courses`、`POST /api/v1/teacher/courses/:courseId/attendance`
- 家长：`GET /api/v1/parent/children`、`GET /api/v1/parent/child/:id/summary`、`GET /api/v1/parent/child/:id/courses`、`GET /api/v1/parent/child/:id/lesson-account`、`GET /api/v1/parent/child/:id/payment-records`
- 创始人：`GET /api/v1/founder/cockpit`、`/api/v1/founder/leads*`、`/api/v1/founder/courses`、`/api/v1/founder/payment-records`、`/api/v1/founder/lesson-accounts`、`/api/v1/founder/attendance-records`
- 平台：`GET /api/v1/admin/ai-audit`

## 6. 对照文件（签字与对外说明）
- [docs/phase1-closeout-report-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-closeout-report-v4.1-internal-CN.md)
- [docs/phase1-final-acceptance-record-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-final-acceptance-record-v4.1-internal-CN.md)
- [docs/phase1-go-live-summary-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-go-live-summary-v4.1-internal-CN.md)
- [docs/phase1-signoff-demo-checklist-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-signoff-demo-checklist-v4.1-internal-CN.md)
- [docs/phase1-delivery-package-v4.1-internal.md](/Users/mason/英语系统/docs/phase1-delivery-package-v4.1-internal.md)

## 7. 下阶段建议（不回填到当前验收）
- P2 优化项：UI 细节、文案统一、体验微调、进阶导出与高级报表
- 不扩展范围项：新增商业化计费、App/小程序正式渠道、支付流程重构
