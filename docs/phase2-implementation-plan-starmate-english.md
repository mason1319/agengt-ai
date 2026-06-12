# StarMate English 第2阶段执行计划

**阶段目标**：在第一阶段文档基础上，把项目从“文档化阶段”推进到“可交付开发阶段”。

## 1. 本次已执行（2026-06-06）

1. 修复前端构建阻塞：`src/main.jsx` 末尾重复片段导致 JSX 语法错误，移除后 `npm run build` 通过。  
2. 统一 R2 绑定兼容：`functions/api/v1/health.js`、`functions/api/v1/admin/culture-wall.js` 改为兼容 `ASSETS` 与 `STAR_MATE_ASSETS` 两种绑定名，避免部署环境差异导致的健康检查与素材功能失败。  
3. 统一 UI 控件映射：`docs/ui-control-api-field-map.csv` 将复盘页和老师工作台刷新控件映射路径改为可被 OpenAPI / 冒烟脚本直接覆盖的标准路径（去掉复合路径及重复具体路径），并与 `openapi-v4.1.yaml` 保持 61/61 覆盖一致。
4. 追加 `institution/*` 契约补齐：`docs/openapi-v4.1.yaml` 已补上 `leads / lessons / students / teachers / payments` 5 个机构域端点，和 `functions/api/v1/institution/*` 实现保持 1:1 覆盖。

## 2. 第二阶段最小交付定义（MVP）

### 目标A：API 稳定性
- 完成 `/api/v1/*` 路由的稳定化梳理，补齐响应 schema 文档
- 核对鉴权链路（`parseAuthContext`）在关键角色接口中的覆盖率
- 统一错误码 `code / request_id / trace_id` 与业务消息口径

### 目标B：前后端联调
- 将前端关键动作统一走 API（登录、角色切换、课时/线索/反馈/课程）
- 建立 `demo` 与 `api` 两种数据源一致性验收清单
- 完成 `/api/v1/bootstrap` 与 `/api/v1/me` 的主链路联通验证

### 目标C：部署与监控准备
- `health`、`/api/v1/public/*`、`/api/v1/admin/*` 做最小冒烟脚本
- 明确 CI/部署触发条件：`npm run build` + 基础 API 返回码验证

## 3. 需求驱动任务拆解（按角色）

### 创始人域
- 线索、课时、课表、AI 预警接口联通：`/api/v1/founder/*`, `/api/v1/institution/*`
- 首页驾驶舱字段口径与现有 seed 数据字段对齐

### 老师域
- 今日课表、学生列表、课堂记录、家长反馈草稿接口联通：`/api/v1/teacher/*`

### 家长/学生域
- 学生成长摘要、进度、课次、今日任务：`/api/v1/parent/*`, `/api/v1/student/*`
- 报表导出链路：`/api/v1/parent/child/[id]/report-export`, `/api/v1/student/report-export`

### 平台运营域
- 机构管理与额度控制、文化墙素材：`/api/v1/admin/*`
- 到期和试用策略由平台页与 API 统一控制

## 4. 本阶段验证清单

1. Build：`npm run build` 必过。  
2. 健康检查：`/api/v1/health` 返回 D1、R2 可用状态。  
3. 登录流程：`/api/v1/auth/login` → `/api/v1/me` 可联动。  
4. 角色隔离：同一接口在非授权角色返回 403/401，并带统一错误码。  
5. 回归：`/api/v1/admin/culture-wall` 上传/读取/删除可通过（优先 ASSETS 绑定为准）。

## 5. 下一步建议（本周）

1. 已形成冒烟验收清单文档：`docs/phase2-api-smoke-checklist.md`，并纳入 `docs/web-delivery-checklist.md` 入口。  
2. 已将 `npm run verify:smoke` 升级为 `scripts/smoke-check.mjs`，覆盖 9 个关键接口 + 角色鉴权边界断言。  
3. 已输出 `docs/CLOUDFLARE_DEPLOYMENT.md`，收敛 `wrangler.toml`、D1/R2、环境变量、绑定、上线与回滚动作。  
4. 下一步建议：按清单执行预发布部署并复测接口，完成后进入角色域联调补齐任务。  
