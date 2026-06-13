# StarMate 第二阶段 API 冒烟验收清单（v1）

目标：把第二阶段“文档可执行化”落到第一轮可复用验收里，先覆盖 23 个关键接口，保证前后端联调稳定性和最小权限隔离。

执行命令：

```bash
cd /Users/mason/英语系统
npm run stack:verify
# 如果你已手动启动后端并仅需要复测逻辑，可执行（未启动后端请改用 stack:verify）：
# npm run verify:smoke
# （等价于：bash ./scripts/smoke-check.sh http://127.0.0.1:8787）
```

可选变量：

- `STARMATE_TOKEN_PLATFORM`、`STARMATE_TOKEN_FOUNDER`、`STARMATE_TOKEN_TEACHER`、`STARMATE_TOKEN_PARENT`、`STARMATE_TOKEN_STUDENT`：如已获取 JWT，可直接注入加速（`STAGE2_TOKEN_*`、`PHASE2_TOKEN_*` 作为兼容别名）。
- `SMOKE_STRICT_AUTH=true`：无 token 时直接失败，不再跳过角色相关断言。
- `SMOKE_ALLOW_SKIP=false`：在缺少 token 情况下不跳过，改为严格失败（与 CI 适配）。
- `SMOKE_TIMEOUT_MS`：HTTP 超时（默认 12000ms）。

建议在 CI/交付复测使用：

```bash
SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false npm run stack:verify
```

本地快速复测建议：

```bash
SMOKE_ALLOW_SKIP=true npm run stack:verify
```

### 验收条目

1. `GET /api/v1/health`
   - 状态码：200
   - 期望：`success === true`，返回 `data` 字段

2. `GET /api/v1/public/courses?limit=10`
   - 状态码：200
   - 期望：`success === true`，`data.courses` 为数组

3. `GET /api/v1/bootstrap?role=founder`
   - 状态码：200
   - 期望：`role === "founder"`，`meta.role === "founder"`

4. `GET /api/v1/bootstrap?role=platform`
   - 状态码：200
   - 期望：`role === "platform"`，`meta.role === "platform"`

5. `GET /api/v1/public/leads?institutionId=inst-star&limit=5`
   - 状态码：200
   - 期望：`success === true`，`data.total` 为数字

6. 登录并鉴权链路（平台）
   - `POST /api/v1/auth/login`（默认 `platform / Platform@123`）
   - `GET /api/v1/me`（携带 token）
   - 状态码均为 200 且 `success === true`

7. 平台权限接口
   - `GET /api/v1/admin/institutions`（platform token）
   - 状态码：200
   - 期望：`success === true`

8. 平台 AI 运营域（新增）
   - `GET /api/v1/admin/ai-usage`（platform token）
   - `GET /api/v1/admin/ai-audit`（platform token）
   - 状态码：200
   - 期望：`success === true`

9. 平台导出接口
   - `GET /api/v1/admin/institutions-export`（platform token）
   - `GET /api/v1/admin/ai-usage-export?days=30&limit=20`（platform token）
   - `GET /api/v1/admin/ai-audit-export?limit=10`（platform token）
   - 状态码：200
   - 期望：`success === true`，`data.fileName` 与 `data.content` 存在

10. 创始人/老师/家长/学生关键域
   - `GET /api/v1/founder/cockpit`
   - `GET /api/v1/founder/leads`
   - `GET /api/v1/teacher/students`
   - `GET /api/v1/parent/children`
   - `GET /api/v1/student/today-path`
   - 各项状态码：200，`success === true`

11. 角色隔离兜底
   - `GET /api/v1/admin/institutions`（student token）
   - 期望状态码：401 或 403

12. 机构线索列表
   - `GET /api/v1/institution/leads?institutionId=inst-star&limit=5`（founder token）
   - 状态码：200
   - 期望：`success === true`，`data.leads` 为数组

13. 机构课次列表
   - `GET /api/v1/institution/lessons?institutionId=inst-star&limit=5`（founder token）
   - 状态码：200
   - 期望：`success === true`，`data.lessons` 为数组

14. 机构学员列表
   - `GET /api/v1/institution/students?institutionId=inst-star&limit=5`（founder token）
   - 状态码：200
   - 期望：`success === true`，`data.students` 为数组

15. 机构老师列表
   - `GET /api/v1/institution/teachers?institutionId=inst-star&limit=5`（founder token）
   - 状态码：200
   - 期望：`success === true`，`data.teachers` 为数组

16. 机构缴费记录列表
   - `GET /api/v1/institution/payments?institutionId=inst-star&limit=5`（founder token）
   - 状态码：200
   - 期望：`success === true`，`data.payments` 为数组

17. 公开试听与咨询附加校验
   - `GET /api/v1/public/leads?institutionId=inst-star&limit=5`（无需鉴权）
   - 状态码：200
   - 期望：`success === true`
   - 该入口同时用于后续公开流程起始线索校验

18. 公开咨询创建与 AI 回复闭环
   - `POST /api/v1/public/leads`（payload 必须含 institutionId/guardianName）
   - `POST /api/v1/public/leads/{leadId}/ai-reply`
   - 状态码：200
   - 期望：`success === true`，返回 `leadId` 与 `reply/messageId`
   - 结果：leadId 回写正确，AI 回执可落库

19. 公开试听预约闭环
   - `POST /api/v1/public/trial-bookings`
   - 先通过 `GET /api/v1/public/courses?institutionId=inst-star&limit=1` 获取课程 id
   - 然后创建 lead 再发起预约
   - 状态码：200
   - 期望：`success === true`，返回 `booking.id` 且 `status === "pending"`

20. 创始人经营对账链路
   - `GET /api/v1/founder/cockpit?courseStatus=active`
   - `GET /api/v1/founder/courses?institutionId={institutionId}&limit=50`
   - `GET /api/v1/founder/payment-records?institutionId={institutionId}&limit=50`
   - `GET /api/v1/founder/lesson-accounts?institutionId={institutionId}&limit=50`
   - `GET /api/v1/founder/attendance-records?institutionId={institutionId}&limit=50`
   - 期望：4 个关键查询均返回 `success === true`；课程、课时、缴费、到课字段结构完整。

### 与交付清单关联

在 `docs/web-delivery-checklist.md` 的 API 自检入口新增了“第二阶段冒烟清单”，建议本地运行：

```bash
npm run stack:verify
```

通过后进入下一步任务：
- API 契约补齐（未落地接口纳入 `openapi-v4.1.yaml`）
- 部署脚本统一（统一输出 `CLOUDFLARE_DEPLOYMENT.md` 运行时清单）
