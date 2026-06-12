# StarMate v4.1 第一阶段收口签字总包（内部自用）

- 版本：v4.1（内部机构版）
- 组织：Aggie速记英语（星伴英语）
- 审核日期：2026-06-12
- 审核模式：收口验收（不扩大 Phase 1 范围）

## 1. 交付范围声明

- 以 `docs/phase1-prd-starmate-english.md` 与 `docs/StarMate-PRD-v4.1-internal-CN.md` 为主线。
- 当前范围固定为内部机构自用第一阶段，不包含：
  - 多机构 SaaS 商业化计费流程
  - App / 小程序正式版
  - 在线支付正式化接入
  - 站外 SDK 大规模引流化

## 2. 证据文件（本次签字依赖）

- 主 PRD：[/Users/mason/英语系统/docs/phase1-prd-starmate-english.md](/Users/mason/英语系统/docs/phase1-prd-starmate-english.md)
- 补充 PRD：[/Users/mason/英语系统/docs/StarMate-PRD-v4.1-internal-CN.md](/Users/mason/英语系统/docs/StarMate-PRD-v4.1-internal-CN.md)
- 架构与交付标准：[/Users/mason/英语系统/docs/phase1-architecture-starmate-english.md](/Users/mason/英语系统/docs/phase1-architecture-starmate-english.md)
- 国际化交付标准：[/Users/mason/英语系统/docs/international-delivery-standards-v4.1-internal.md](/Users/mason/英语系统/docs/international-delivery-standards-v4.1-internal.md)
- 合同与映射：[/Users/mason/英语系统/docs/openapi-v4.1.yaml](/Users/mason/英语系统/docs/openapi-v4.1.yaml)、[/Users/mason/英语系统/docs/ui-control-api-field-map.csv](/Users/mason/英语系统/docs/ui-control-api-field-map.csv)、[/Users/mason/英语系统/schema.sql](/Users/mason/英语系统/schema.sql)
- 闭环报告：[/Users/mason/英语系统/docs/phase1-closeout-report-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-closeout-report-v4.1-internal-CN.md)
- 验收记录：[/Users/mason/英语系统/docs/phase1-final-acceptance-record-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-final-acceptance-record-v4.1-internal-CN.md)
- 签字清单：[/Users/mason/英语系统/docs/phase1-signoff-onepage-checklist-v4.1-internal-CN.md](/Users/mason/英语系统/docs/phase1-signoff-onepage-checklist-v4.1-internal-CN.md)
- 交付清单：[/Users/mason/英语系统/docs/phase1-delivery-package-v4.1-internal.md](/Users/mason/英语系统/docs/phase1-delivery-package-v4.1-internal.md)

## 3. 关键验收门禁（已执行）

- `npm run validate:contracts`：通过（76/76）
- `npm run stack:verify`：通过（26/26）
- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm run test`：通过（26/26）
- `npm run build`：通过
- `npm run audit:deps`：通过
- `npm run audit:dead-code`：通过
- `npm run audit:security`：通过
- 浏览器渲染检查：通过（学生页关键内容、家长练习只读视角）
- `npm run verify:smoke`：直接执行失败（`http 0`，原因是本地未起后端服务）；
  - 说明：`npm run stack:verify` 在同机启动后端后全量通过。

## 4. 按链路闭环验收结论

### 登录与会话
- `POST /api/v1/auth/login` 与 `GET /api/v1/me` 可用；权限上下文可识别。

### 公开咨询
- `GET /api/v1/public/courses`、`POST /api/v1/public/leads`、`POST /api/v1/public/leads/{leadId}/ai-reply`、`POST /api/v1/public/trial-bookings` 全链路可测。

### 学生
- `GET /api/v1/student/today-path`、`POST /api/v1/student/voice-practice/assess`、`GET /api/v1/student/review/{type}`、`GET /api/v1/student/lesson-account` 已闭环。

### 老师
- `GET /api/v1/teacher/students`、`GET /api/v1/teacher/courses/{courseId}/attendance`、`POST /api/v1/teacher/courses/{courseId}/attendance`、`POST /api/v1/teacher/student/{studentId}/intervention` 已闭环。

### 家长
- `GET /api/v1/parent/children`、`GET /api/v1/parent/child/{id}/summary`、`GET /api/v1/parent/child/{id}/courses`、`GET /api/v1/parent/child/{id}/lesson-account`、`GET /api/v1/parent/child/{id}/payment-records`、`GET /api/v1/parent/child/{id}/report-export` 已闭环。

### 创始人
- `GET /api/v1/founder/cockpit`、`/api/v1/founder/leads`、`/api/v1/founder/courses`、`/api/v1/founder/payment-records`、`/api/v1/founder/lesson-accounts`、`/api/v1/founder/attendance-records`、`/api/v1/founder/ai-usage` 已闭环。

## 5. 风险归类（当前收口态）

- P0：无
- P1：无
- P2：有（不阻塞）
  - `npm run verify:smoke` 环境启动依赖说明固化不足；建议用 `stack:verify` 作为日常验收标准命令。
  - 少量体验文案与视觉微调项留作下一迭代（不影响业务闭环）。
  - 练习题库持久化、家校沟通稿正式入库等增强项进入 Phase 2，不阻塞 Phase 1。

## 6. 签字

- 结论：第一阶段闭环可交付，允许内部试运行/候选发布。

| 角色 | 姓名 | 日期 | 签字 |
|---|---|---|---|
| 产品负责人 |  |  |  |
| 架构负责人 |  |  |  |
| 开发负责人 |  |  |  |
| 运营负责人 |  |  |  |
| 审核人 |  |  |  |

## 7. 下一步

- 如需，我可直接把此文件中的签字栏改为你要的“最终放行/仅试运行”格式，并生成一版 PDF 打印版。
