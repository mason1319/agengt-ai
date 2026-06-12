# StarMate v4.1 第一阶段收口签字清单（内部版 · 1 页）

## 签字项目

执行人：__________     日期：__________

### 1）闭环验收（必须全部打钩）

- [x] 登录链路：`/api/v1/auth/login` 可用，`/api/v1/me` 可回读。
- [x] 公开入口链路：`/api/v1/public/courses`、`/api/v1/public/leads`、`/api/v1/public/leads/{id}/ai-reply`、`/api/v1/public/trial-bookings`。
- [x] 学生链路：`/api/v1/student/today-path`、`/api/v1/student/voice-practice/assess`、`/api/v1/student/review/{type}`、`/api/v1/student/lesson-account`。
- [x] 老师链路：`/api/v1/teacher/students`、`/api/v1/teacher/courses/{courseId}/attendance`、`/api/v1/teacher/student/{studentId}/intervention`。
- [x] 家长链路：`/api/v1/parent/children`、`/api/v1/parent/child/{id}/summary`、`/api/v1/parent/child/{id}/lesson-account`、`/api/v1/parent/child/{id}/payment-records`、`/api/v1/parent/child/{id}/courses`、`/api/v1/parent/child/{id}/report-export`。
- [x] 创始人链路：`/api/v1/founder/cockpit`、`/api/v1/founder/leads`、`/api/v1/founder/courses`、`/api/v1/founder/lesson-accounts`、`/api/v1/founder/payment-records`、`/api/v1/founder/attendance-records`、`/api/v1/founder/ai-usage`。

### 2）质量门禁（已通过）

- [x] `npm run validate:contracts`
- [x] `npm run audit:deps`
- [x] `npm run audit:security`
- [x] `npm run audit:dead-code`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run build`
- [x] `npm run stack:verify`（26/26）
- [x] `npm run verify:smoke`（通过 `npm run stack:verify` 启动后端后，完整通过）
- [x] 浏览器渲染检查（学生页关键内容、家长练习只读视角）

### 3）风险等级（按本次版本状态）

- P0：未发现
- P1：未发现
- P2：有（不阻塞；见《未决问题》）

### 4）AI 真实模型（如启用）

- [x] AI 配置与回退策略说明已在 `README.md`、`docs/CLOUDFLARE_DEPLOYMENT.md` 说明。
- [x] `functions/api/v1/ai/agent.js` 已支持 provider 异常回退至 mock，不影响主闭环。
- [ ] 若启用真实模型，需补充正式密钥回归联调记录。

### 5）上线环境

- 外网：`https://aggieai.me`
- 外网：`https://www.aggieai.me`
- 预发：`https://c1949d07.starmate-english-saas.pages.dev`

### 6）结论（选一）

- [ ] 同意第一阶段收口上线
- [ ] 仅试运行（列条件）
- [ ] 退回修复

签字：__________
