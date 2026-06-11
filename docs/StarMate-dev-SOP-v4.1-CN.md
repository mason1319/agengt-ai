# 星伴英语 StarMate 研发 SOP v4.1

**文档类型**：研发执行标准 / 开发流程 SOP  
**对应 PRD**：`StarMate-PRD-v4.1-internal-CN.md`  
**对应设计文档**：`StarMate-design-v4.1-internal-CN.md`  
**项目阶段**：Phase 1 内部 Web 可用版  
**适用范围**：本机构内部学生、老师、家长、创始人；外部咨询客户仅限咨询、课程查看、试听预约  
**日期**：2026-06-06  

---

## 1. 研发目标

本 SOP 的目标是确保星伴英语第一阶段交付的不是静态演示页面，而是可登录、可落库、可上传、可审计、可部署到 Cloudflare 的内部可用系统。

第一阶段研发只围绕七个闭环：

| 闭环 | 必须完成 |
|---|---|
| 学生学习闭环 | 今日任务 → 口语/复习 → 反馈 → 落库 |
| 老师干预闭环 | 异常 → 查看授权学生 → 提交干预 |
| 家长反馈闭环 | 查看孩子摘要 → 周报 → 申请关注 |
| 创始人管理闭环 | 看活跃、异常、老师处理、AI 用量 |
| 招生咨询闭环 | AI 客服 → 线索 → 试听预约 → 人工跟进 |
| 课程收费闭环 | 课程发布 → 公开展示 → 报名 → 收费记录 → 家长可查 |
| 课时打卡闭环 | 老师点名 → 消课/保留 → 家长可查 → 创始人对账 |

---

## 2. 总流程

```text
PRD 确认
  → 设计文档确认
  → OpenAPI 合约
  → D1 schema
  → 控件-API-字段映射表
  → 后端接口开发
  → 前端页面开发
  → 前后端联调
  → 质量扫描
  → Cloudflare Preview
  → 本机构验收
  → Production 发布
```

硬规则：没有 API 合约和 D1 字段映射，不进入页面开发。

---

## 3. 开发顺序

### 3.1 必须顺序

| 顺序 | 工作 | 产物 |
|---|---|---|
| 1 | 锁定 PRD | `phase1-prd-starmate-english.md` |
| 2 | 锁定设计文档 | `StarMate-design-v4.1-internal-CN.md` |
| 3 | 输出 API 合约 | `openapi-v4.1.yaml` |
| 4 | 输出 D1 schema | `schema.sql` |
| 5 | 输出控件映射 | `ui-control-api-field-map.csv` |
| 6 | 开发后端接口 | `/functions/api/v1/*` 或等价结构 |
| 7 | 开发前端页面 | React + Vite + shadcn/ui |
| 8 | 联调 | 真实 API + D1 + R2 |
| 9 | 扫描 | lint/typecheck/build/test |
| 10 | 部署 | Cloudflare Pages Preview |

### 3.2 禁止顺序

| 禁止项 | 原因 |
|---|---|
| 先写静态前端页面 | 容易产生空按钮和假数据 |
| 先做 UI 美化再补接口 | 会偏离可交付系统 |
| 页面控件没有 API 就合并 | 不符合 v4.1 验收标准 |
| 生产环境使用静态 mock | 无法真实验收 |
| 老师端直接展示全部学生 | 违反授权规则 |

---

## 3.3 国际标准代码质量门禁

本项目不接受“能看但不能用”的静态页面，也不接受靠堆叠代码完成表面功能。每次开发必须同时满足接口、类型、权限、数据、扫描和部署要求。

| 门禁 | 标准 |
|---|---|
| 接口先行 | 先写 OpenAPI，再写后端，再接前端 |
| 类型安全 | 前后端 TypeScript strict，不允许随意使用 `any` |
| 权限先行 | 任何数据查询先过 RBAC，不允许页面端自我约束代替后端权限 |
| 数据真实 | 生产路径数据必须来自 D1/R2/API，不允许业务 mock |
| 控件可用 | 每个按钮、弹窗、输入框、统计卡必须绑定接口或明确路由 |
| 结构分层 | 页面、组件、hooks、service、api client、types 分层清楚 |
| 无冗余 | 未使用组件、未使用函数、重复封装、临时调试代码必须删除 |
| 可审计 | 登录、AI、收费、课时、点名、人工接管都必须有日志 |
| 可回滚 | migration、配置、Cloudflare Preview 必须可追踪 |

### 3.4 禁止合并条件

出现以下任一情况，本次开发不能合并，不能进入验收。

| 情况 | 处理 |
|---|---|
| `npm run lint` 失败 | 修复后再提交 |
| `npm run typecheck` 失败 | 修复类型，不允许关闭 strict 逃避 |
| `npm run build` 失败 | 修复构建 |
| `npm run test` 失败 | 修复核心逻辑 |
| `npm run audit:dead-code` 发现未使用文件或导出 | 删除或合并 |
| `npm run audit:deps` 发现无用依赖 | 删除依赖 |
| `npm run audit:security` 有高风险问题 | 修复后复验 |
| `npm run validate:contracts` 发现控件、API、字段不一致 | 补齐映射或删除控件 |
| 页面存在无接口按钮 | 删除或补接口 |
| API 返回越权数据 | 修复后端权限 |
| AI 客服前端假回复 | 改为后端生成并落库 |

### 3.5 前端代码标准

| 标准 | 要求 |
|---|---|
| 页面职责 | 页面只做布局和组合，不写复杂业务流程 |
| 组件职责 | 组件只处理展示和局部交互，不直接拼 SQL 或写权限逻辑 |
| 数据请求 | 统一 API client，不允许组件里散落 `fetch` |
| 状态 | Loading、Empty、Error、Success 必须完整 |
| 样式 | 使用 shadcn/ui + Tailwind token，不新增零散 CSS 文件 |
| 响应式 | 375px、平板、桌面必须可用，不横向溢出 |
| 可访问性 | 表单 label、键盘焦点、颜色对比必须达标 |
| 删除冗余 | 未使用组件、hooks、types、工具函数交付前删除 |

### 3.6 后端代码标准

| 标准 | 要求 |
|---|---|
| 路由 | `/api/v1` 统一版本，不允许散乱接口 |
| 校验 | 写接口必须 Zod 或等价 schema 校验 |
| 权限 | 后端统一 RBAC 中间件，不允许只靠前端隐藏 |
| 错误 | API 错误返回统一结构 |
| 数据一致性 | 收费、报名、点名、消课、保留课时必须保证一致 |
| 审计 | 关键写操作记录操作者、对象、动作、原因、时间 |
| 限流 | 公开咨询、AI 回复、录音上传必须限流 |
| 隐私 | R2 私有桶、签名 URL、联系方式脱敏 |
| 配置 | 密钥只放环境变量，不写入代码和文档 |

---

## 4. 目录规范

建议结构：

```text
/
├─ docs/
│  ├─ phase1-prd-starmate-english.md
│  ├─ StarMate-design-v4.1-internal-CN.md
│  ├─ StarMate-dev-SOP-v4.1-CN.md
│  ├─ openapi-v4.1.yaml
│  ├─ ui-control-api-field-map.csv
│  └─ d1-schema-notes-v4.1.md
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ lib/
│  ├─ routes/
│  └─ styles/
├─ functions/
│  └─ api/
│     └─ v1/
├─ migrations/
│  └─ 0001_init.sql
├─ public/
├─ schema.sql
├─ wrangler.toml
└─ package.json
```

说明：

| 目录 | 规则 |
|---|---|
| `src/features` | 按角色/业务域拆分：student、teacher、parent、founder、auth |
| `src/components` | 只放可复用 UI 组件 |
| `src/lib/api` | 前端 API client |
| `functions/api/v1` | Cloudflare Pages Functions 接口 |
| `migrations` | D1 迁移脚本 |
| `schema.sql` | 当前 schema 快照 |

---

## 5. API 研发规范

### 5.1 API 基线

| 项 | 规则 |
|---|---|
| 前缀 | `/api/v1` |
| 鉴权 | 除 `/auth/*`、公开咨询 `/public/leads`、试听预约 `/public/trial-bookings`、公开课程 `/public/courses` 外全部需要 token |
| 响应格式 | `{ code, message, data, trace_id, request_id }` |
| 写接口 | 必须支持幂等或重复提交防护 |
| 错误 | 不允许静默失败 |
| 审计 | 登录、上传、评分、干预、导出必须写审计 |

### 5.2 错误码

| code | 场景 |
|---|---|
| `400` | 参数错误 |
| `401` | 未登录或 token 失效 |
| `403` | 权限不足 |
| `404` | 资源不存在 |
| `409` | 重复提交或状态冲突 |
| `429` | 请求过快 |
| `500` | 服务端错误 |

### 5.3 权限检查

所有接口必须检查：

```text
user_id
role
institution_id
resource ownership
```

老师接口必须额外检查 `teacher_students` 授权关系。  
家长接口必须额外检查 `guardian_id` 与 `student_id` 绑定关系。

公开咨询接口必须额外检查：隐私确认、频率限制、来源记录、手机号/联系方式格式、AI 客服输出安全过滤。

### 5.4 招生咨询与 AI 客服接口

| API | 鉴权 | 要求 |
|---|---|---|
| `POST /api/v1/public/leads` | 免登录 | 必须带隐私确认、来源、联系方式，写入 `leads` |
| `POST /api/v1/public/leads/:id/ai-reply` | 免登录/会话态 | 后端生成 AI/规则化回复，写入 `lead_messages` |
| `POST /api/v1/public/trial-bookings` | 免登录/会话态 | 写入 `trial_bookings`，关联 lead |
| `GET /api/v1/founder/leads` | 创始人/运营 | 查看线索列表 |
| `POST /api/v1/founder/leads/:id/takeover` | 创始人/运营 | 人工接管 AI 客服 |
| `POST /api/v1/founder/leads/:id/convert` | 创始人/运营 | 转正式学生和家长账号 |

AI 客服研发规则：

| 规则 | 说明 |
|---|---|
| 后端生成 | 不允许前端写死 AI 回复 |
| 可降级 | 模型不可用时使用规则化话术 |
| 有边界 | 只能展示公开课程价格，不承诺提分、录取、保留名额、特殊优惠 |
| 有审计 | AI 回复、人工接管、预约都写日志 |
| 有限流 | 防止恶意刷咨询 |

### 5.5 课程表与收费接口

| API | 鉴权 | 要求 |
|---|---|---|
| `GET /api/v1/public/courses` | 免登录 | 只返回公开课程字段：课程、时间、年级、价格、剩余名额 |
| `GET /api/v1/public/courses/:id` | 免登录 | 公开课程详情，不返回学生名单和收费记录 |
| `GET /api/v1/parent/child/:studentId/courses` | 家长 | 只返回自己孩子课程和缴费状态 |
| `GET /api/v1/student/courses` | 学生 | 只返回本人课程安排 |
| `GET /api/v1/teacher/courses` | 老师 | 只返回自己负责课程 |
| `GET /api/v1/founder/courses` | 创始人/运营 | 返回课程、报名、收费统计 |
| `POST /api/v1/founder/courses` | 创始人/运营 | 创建课程 |
| `PATCH /api/v1/founder/courses/:id` | 创始人/运营 | 修改课程 |
| `POST /api/v1/founder/courses/:id/enrollments` | 创始人/运营 | 添加报名 |
| `POST /api/v1/founder/payment-records` | 创始人/运营 | 记录线下/人工收费 |

公开课程接口禁止返回：学生名单、家长电话、实收金额、欠费详情、内部备注。

课程公开字段必须包含：

| 字段 | 说明 |
|---|---|
| `course_name` | 课程名称 |
| `course_type` | 音标/自然拼读/课内同步/新概念/专项提升 |
| `class_type` | 小班课/大班课/一对一 |
| `grade_range` | 适合年级 |
| `start_date` / `end_date` | 开课/结课日期 |
| `weekday` | 上课星期 |
| `time_slot` | 上课时间段 |
| `total_sessions` | 总课次 |
| `session_duration` | 单次时长 |
| `single_period_price` | 单期价格 |
| `bundle_price` | 连报/组合价格 |
| `capacity` | 限招人数 |
| `remaining_seats` | 剩余名额 |

### 5.6 课时账户与每日打卡接口

| API | 鉴权 | 要求 |
|---|---|---|
| `GET /api/v1/parent/child/:studentId/lesson-account` | 家长 | 只返回自己孩子的缴费和课时 |
| `GET /api/v1/student/lesson-account` | 学生 | 只返回本人课时 |
| `GET /api/v1/teacher/courses/:courseId/attendance` | 老师 | 只返回负责课程点名表 |
| `POST /api/v1/teacher/courses/:courseId/attendance` | 老师 | 提交到课/请假/缺课/迟到 |
| `GET /api/v1/founder/lesson-accounts` | 创始人/运营 | 查看全部课时账户 |
| `PATCH /api/v1/founder/lesson-accounts/:id/adjust` | 创始人/运营 | 手动调整课时，必须填写原因 |
| `GET /api/v1/founder/attendance-records` | 创始人/运营 | 查看消课、保留、缺课记录 |

课时接口规则：

| 规则 | 说明 |
|---|---|
| 到课默认消课 | 写入 `attendance_records` 并扣减 `lesson_accounts` |
| 请假默认保留 | 不扣课，记录原因 |
| 机构停课默认保留 | 不扣课，记录原因 |
| 无故缺课按配置 | 由机构规则决定是否扣课 |
| 手动调整强审计 | 必须记录调整前后、原因、操作人 |

---

## 6. D1 数据库规范

### 6.1 基线

| 项 | 规则 |
|---|---|
| 数据库 | Cloudflare D1 |
| JSON | 禁止 `JSONB`，使用 `TEXT(JSON)` |
| 主键 | 统一 `id` |
| 时间 | `created_at`、`updated_at` |
| 机构隔离 | 业务表必须有 `institution_id` |
| 软删除 | 账号、学生、家长、老师优先使用 `status` |
| 审计 | 关键行为写入 `audit_logs` |

### 6.2 第一阶段必须表

| 表 | 说明 |
|---|---|
| `institutions` | 单机构信息 |
| `users` | 登录账号 |
| `students` | 学生档案 |
| `guardians` | 家长档案 |
| `teachers` | 老师档案 |
| `teacher_students` | 老师授权 |
| `learning_tasks` | 学习任务 |
| `learning_events` | 学习事件 |
| `voice_attempts` | 录音与评分 |
| `review_items` | 复习队列 |
| `teacher_interventions` | 老师干预 |
| `parent_reports` | 家长周报 |
| `ai_usage_logs` | AI 用量 |
| `media_assets` | R2 文件索引 |
| `audit_logs` | 审计日志 |
| `internal_usage_limits` | 内部配额 |
| `leads` | 招生咨询线索 |
| `lead_messages` | AI 客服咨询对话 |
| `lead_followups` | 人工跟进记录 |
| `trial_bookings` | 试听预约 |
| `course_offerings` | 可报名课程和课程价格 |
| `course_sessions` | 开课/每次上课时间 |
| `enrollments` | 报名记录 |
| `payment_records` | 内部收费记录 |
| `lesson_accounts` | 学生课时账户 |
| `attendance_records` | 到课/请假/缺课/消课记录 |

### 6.3 迁移规范

| 规则 | 说明 |
|---|---|
| 不直接改生产表 | 通过 migration |
| 每次变更有编号 | `0001_init.sql`、`0002_add_voice_attempts.sql` |
| 变更需可回滚 | 至少写明回滚策略 |
| 不删除历史字段 | 废弃字段先标记 deprecated |

---

## 7. R2 文件规范

### 7.1 文件范围

| 文件 | 是否进入 R2 |
|---|---|
| 学生录音 | 是 |
| 文化墙图片/视频 | 预留 |
| 导出报表 | 是 |
| 临时前端资源 | 否 |

### 7.2 安全规则

| 规则 | 说明 |
|---|---|
| 私有桶 | 默认不公开 |
| 访问 | 使用签名 URL 或后端转发 |
| 文件大小 | 第一阶段限制单音频大小 |
| 文件类型 | 只允许白名单类型 |
| 生命周期 | 默认录音 30 天保留 |
| 索引 | 每个 R2 文件必须写 `media_assets` |

---

## 8. 前端研发规范

### 8.1 技术栈

| 项 | 规则 |
|---|---|
| 框架 | React + Vite + TypeScript |
| UI | shadcn/ui |
| 样式 | Tailwind + shadcn token |
| 图标 | lucide-react |
| API | 统一 API client |

### 8.2 样式规则

允许：

| 允许项 | 说明 |
|---|---|
| 一个全局 CSS 入口 | Tailwind 和 shadcn token |
| Tailwind 原子类 | 页面布局和组件状态 |
| shadcn theme token | 主题统一 |

禁止：

| 禁止项 | 说明 |
|---|---|
| 业务页面独立 `.css` 文件 | 避免样式失控 |
| 大量内联 style | 除动态尺寸外不使用 |
| 自建组件库替代 shadcn | 除非组件不存在且有理由 |

### 8.3 页面规则

| 规则 | 说明 |
|---|---|
| 每页一个主操作 | 尤其学生端 |
| 每个按钮有 API 或路由 | 无映射不合并 |
| 状态完整 | Loading/Empty/Error/Success |
| 移动适配 | 375px 无横向溢出 |
| 角色隔离 | 不同角色不同入口 |

---

## 9. Mock 管控

### 9.1 允许范围

| 阶段 | 允许 |
|---|---|
| 设计评审 | Figma 示例数据 |
| 本地开发 | seed 数据、后端生成 mock |
| AI Phase 1 | 规则化 AI 结果 |

### 9.2 禁止范围

| 禁止 | 说明 |
|---|---|
| 生产前端硬编码学习结果 | 不可验收 |
| 按钮只改前端状态不调接口 | 不可验收 |
| 老师/家长/学生权限用前端假判断 | 必须后端校验 |
| 假 R2 地址 | 录音必须真实进入 R2 或明确本地降级 |

---

## 10. 质量门禁

### 10.1 必跑命令

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run scan:unused
npm run scan:security
```

如果项目脚本未建立，必须在第一阶段补齐。

### 10.2 通过标准

| 项 | 标准 |
|---|---|
| lint | 无阻断错误 |
| typecheck | 通过 |
| build | 通过 |
| test | 关键用例通过 |
| unused | 无明显死代码 |
| security | 无高危依赖漏洞 |

---

## 11. 安全审计 SOP

### 11.1 每轮必须检查

| 项 | 检查 |
|---|---|
| 登录 | 失败限频、token 失效 |
| 老师权限 | 不能看未授权学生 |
| 家长权限 | 不能看其他孩子 |
| 创始人权限 | 只能本机构 |
| R2 文件 | 不能公开裸链 |
| 录音 | 有用途说明和保留周期 |
| 审计日志 | 关键写操作有记录 |
| 公开咨询 | 有隐私勾选、限流、反垃圾、AI 回复审计 |

### 11.2 儿童数据

| 规则 | 说明 |
|---|---|
| 家长授权 | 儿童账号绑定家长 |
| 语音采集说明 | 登录或首次录音前展示 |
| 数据最小化 | 不采集无关信息 |
| 社交功能 | 第一阶段不做 |
| 排行榜 | 第一阶段不做 |

---

## 12. Cloudflare 部署 SOP

### 12.1 环境

| 环境 | 用途 |
|---|---|
| local | 本地开发 |
| preview | Cloudflare Pages 预览 |
| production | 正式使用 |

### 12.2 资源

| 资源 | 用途 |
|---|---|
| Pages | 前端和 Functions |
| D1 | 业务数据 |
| R2 | 音频和文件 |
| KV | 可选，限流/缓存 |

### 12.3 发布流程

```text
npm run ci:quality
  → npm run build
  → wrangler d1 migrations apply preview
  → Cloudflare Pages Preview
  → 冒烟测试
  → 人工确认
  → Production 发布
```

### 12.4 回滚

| 场景 | 操作 |
|---|---|
| 前端问题 | 回滚 Pages 部署版本 |
| API 问题 | 回滚 Functions 版本 |
| D1 问题 | 按 migration 回滚策略处理 |
| R2 问题 | 保留原文件，不做覆盖删除 |

---

## 13. 冒烟测试清单

| 编号 | 测试 | 通过 |
|---|---|---|
| S1 | 学生登录成功 | 进入学生首页 |
| S2 | 学生获取今日任务 | API 返回 D1 数据 |
| S3 | 学生上传录音 | R2 有文件，D1 有记录 |
| S4 | 学生看到反馈 | 后端返回结果 |
| S5 | 老师登录 | 只看到授权学生 |
| S6 | 老师提交干预 | D1 有记录 |
| S7 | 家长登录 | 只看到自己孩子 |
| S8 | 创始人登录 | 看板数据正常 |
| S9 | 未登录访问 | 跳转登录 |
| S10 | 手机 375px | 无横向溢出 |

---

## 14. 交付物清单

每次阶段交付必须包含：

| 交付物 | 必须 |
|---|---|
| PRD 版本 | 是 |
| 设计文档版本 | 是 |
| API 合约 | 是 |
| D1 schema | 是 |
| 控件-API-字段映射表 | 是 |
| 代码变更说明 | 是 |
| 质量扫描结果 | 是 |
| Cloudflare Preview 地址 | 是 |
| 冒烟测试结果 | 是 |
| 已知问题清单 | 是 |

---

## 15. 合并阻断条件

出现以下任一情况，不允许合并或交付：

| 阻断项 | 说明 |
|---|---|
| 构建失败 | `npm run build` 不通过 |
| 类型错误 | `npm run typecheck` 不通过 |
| 核心按钮无 API | 违反控件映射 |
| 生产 mock | 真实验收无效 |
| 权限越权 | 老师/家长看到不该看的数据 |
| R2 裸公开 | 录音隐私风险 |
| 学习事件不落库 | 学生闭环不成立 |
| 审计缺失 | 关键写操作不可追踪 |

---

## 16. Phase 1A 开发拆分

### 16.1 后端优先

| 任务 | 输出 |
|---|---|
| 建 D1 schema | `schema.sql` + migration |
| 登录接口 | `/api/v1/auth/*` |
| 今日任务接口 | `/api/v1/student/today-path` |
| 录音上传接口 | R2 + `voice_attempts` |
| 创始人基础看板 | `/api/v1/founder/cockpit` |
| 招生咨询接口 | `/api/v1/public/leads` + AI 客服规则化回复 |
| 公开课程接口 | `/api/v1/public/courses` 只返回公开价格和剩余名额 |

### 16.2 前端随后

| 页面 | 输出 |
|---|---|
| 登录页 | 真实登录 |
| 学生首页 | 今日任务 |
| 口语练习 | 录音 + 上传 + 反馈 |
| 结果页 | 学习结果 |
| 创始人驾驶舱 | 基础数据 |
| 公开咨询页 | AI 客服咨询 + 试听预约 |
| 公开课程表 | 课程卡片 + 价格 + 试听入口 |

### 16.3 Phase 1B

| 模块 | 输出 |
|---|---|
| 老师异常 | 看板 + 干预 |
| 家长摘要 | 成长卡 + 周报 |
| 复习队列 | 错题复活 |
| 审计增强 | AI 用量和操作日志 |
| 招生线索 | 线索看板、人工接管、转正式学生 |
| 课程与收费 | 课程管理、报名、收费记录 |
| 课时打卡 | 到课、请假、缺勤、迟到、消课、保留课时 |
| 课时对账 | 家长课时账户、创始人课时调整审计、课程报名一致性检查 |

---

## 17. 研发纪律

| 纪律 | 说明 |
|---|---|
| 不堆无用代码 | 未引用代码必须删 |
| 不做空页面 | 页面必须接真实接口 |
| 不扩大范围 | Phase 1 不做商用功能 |
| 不跳过权限 | 后端必须校验 |
| 不跳过验收 | 每次交付跑冒烟 |
| 不破坏现有数据 | 迁移必须可回滚 |

---

## 18. 下一步

按本 SOP，下一步不是直接写页面，而是输出：

1. `OpenAPI v4.1` 接口合约
2. `D1 schema v4.1` 表结构
3. `页面控件-API-字段映射表`
4. `Phase 1A 开发任务清单`
