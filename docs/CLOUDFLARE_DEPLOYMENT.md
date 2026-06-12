# StarMate English Cloudflare Pages 部署清单

## 适用范围

- 项目：`starmate-english-saas`
- 运行栈：`React + Vite + Cloudflare Pages/Functions + D1 + R2`
- 当前阶段目标：网页验收可复用的 Pages 上线标准；数据库与 AI 供应侧按阶段逐步打实。

## 0. 运行前提

- 仓库代码位于：`/Users/mason/英语系统`
- `wrangler` 可用（`npm i -g wrangler` 或项目依赖）
- 已在 Cloudflare Dashboard 能看到 Pages 项目 `starmate-english-saas`
- `wrangler.toml` 与 `package.json` 中脚本保持一致：
  - `npm run web:build`
  - `npm run cf:deploy`
  - `npm run cf:deploy:ensure`

## 1. Cloudflare Pages 项目与构建设置

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages** -> **starmate-english-saas**
2. 绑定构建参数（首次或复核）：
   - Framework preset：`Vite`
   - Build command：`npm run web:build`
   - Build output directory：`dist`
   - Node.js：`20.x`（或更高兼容版本）
3. 推荐启用：
   - `Always Use HTTPS`
   - `Brotli`
   - `Auto Minify`（HTML/CSS/JS）

## 2. 环境与密钥（Pages Settings）

### 2.1 Pages 环境变量（构建时注入）

将以下变量加入 `Settings -> Environment Variables`（按环境区分可选 `preview/production`）：

- `APP_NAME`
- `APP_ENV`
- `PLAN_CHECKPOINT`
- `AI_MODE`
- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_MODEL`
- `AI_DAILY_LIMIT`
- `ALLOW_DEMO_LOGIN`
- `VITE_DATA_SOURCE`
- `VITE_API_BASE`
- `VITE_API_TIMEOUT_MS`
- `VITE_APP_NAME`
- `VITE_APP_BUILD_TAG`

### 2.2 Pages Secret（仅 `wrangler secret`/Dashboard Secrets）

- `JWT_SECRET`（鉴权密钥）
- `AI_API_KEY`（若接入 provider/real 模式）

> `AI_PROVIDER` 可写任意 OpenAI 兼容提供方标识，真正生效的关键是 `AI_BASE_URL` 与 `AI_API_KEY`。

### 2.3 国内模型接入模板

如果后续要接国内 OpenAI 兼容模型，只需替换：

```bash
AI_MODE=provider
AI_PROVIDER=your-provider-name
AI_BASE_URL=https://your-provider.example/v1
AI_MODEL=your-model-name
wrangler secret put AI_API_KEY
```

- `AI_PROVIDER` 只是标识名，不绑定具体厂商逻辑。
- `AI_BASE_URL` 必须填写该厂商的 OpenAI 兼容接口地址。
- `AI_MODEL` 填该厂商实际可用模型名。

### 2.4 国内模型预设速查

| 预设 | `AI_PROVIDER` | `AI_BASE_URL` | `AI_MODEL` |
| --- | --- | --- | --- |
| DeepSeek | `deepseek` | `https://api.deepseek.com` | `deepseek-chat` |
| Qwen | `qwen` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| Moonshot | `moonshot` | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| 豆包 | `doubao` | `https://ark.cn-beijing.volces.com/api/v3` | `ep-202406` |
| 智谱 | `zhipu` | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-plus` |

- 以上均为 OpenAI 兼容接口接法。
- 真正需要注入的是 `AI_BASE_URL`、`AI_MODEL` 和 `AI_API_KEY`。

### 2.6 AI 接入“三步快开”清单（本地 + 部署）

1. 本地验证（不写仓库密钥）

```bash
cd /Users/mason/英语系统
cp .env.example .env
export AI_MODE=provider
export AI_PROVIDER=qwen
export AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
export AI_MODEL=qwen-plus
export AI_API_KEY=你的真实密钥
npm run stack:verify
```

通过后，`/api/v1/ai/agent` 回包应出现 `output.source='provider'`（网络抖动时可能返回 `source='mock'`）。

2. 生产环境注入（推荐）

```bash
wrangler secret put AI_MODE
wrangler secret put AI_PROVIDER
wrangler secret put AI_BASE_URL
wrangler secret put AI_MODEL
wrangler secret put AI_API_KEY
```

输入值示例：

```text
AI_MODE=provider
AI_PROVIDER=qwen
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-plus
```

3. 部署与回退

```bash
npm run cf:deploy:ensure
```

如遇模型异常：先将 `AI_MODE` 调回 `mock`（保持业务链路不影响），修复密钥/网络后再切回 `provider`。

### 2.5 默认建议值（最低可运行）

- 本地：`VITE_DATA_SOURCE=api`，`VITE_API_BASE=/api`
- 本地/开发：`APP_ENV=development`，`ALLOW_DEMO_LOGIN=false`
- 第一阶段演示：`AI_MODE=mock`

## 3. 函数与数据库/对象绑定

### 3.1 D1（`functions` 读写层）

1. 进入 **D1 SQL Database** 创建（或确认）数据库：
   - `database_name` 建议：`starmate_english`
   - 记录数据库 ID
2. 绑定到 Pages：
   - Type：`D1 Database`
   - Variable name：`DB`
   - 绑定到 `starmate_english`

### 3.2 R2（资源对象存储）

1. 进入 **R2 Object Storage** 创建（或确认） bucket：
   - 建议名称：`starmate-english-assets`
2. 绑定到 Pages：
   - Type：`R2 Bucket`
   - Variable name：`STAR_MATE_ASSETS`
   - 选择上述 bucket
3. 兼容性说明：后端 `/api/v1/health` 与素材上传逻辑已兼容 `STAR_MATE_ASSETS` 和 `ASSETS`（历史兼容），优先以 `STAR_MATE_ASSETS` 为标准。

### 3.3 自定义域名

- 预期公开域名：`aggieai.me`、`www.aggieai.me`
- 预发布域名（若使用）：`b2f4b9fe.starmate-english-saas.pages.dev`（可保留校验）

## 4. 生产前置检查（本地）

```bash
cd /Users/mason/英语系统
npm ci
npm run web:build
npm run stack:verify
```

要求：
- `stack:verify` 完成时应输出成功提示（通常为 `Smoke check passed: 26/26` 或等价口径）；并在未启动状态下避免直接复测 `npm run verify:smoke`。
- 健康接口返回 DB/R2 状态正常：`/api/v1/health`
- 登录/鉴权链路可通：`/api/v1/auth/login` + `/api/v1/me`
- 平台接口可通：`/api/v1/admin/institutions`

## 5. 部署执行

### 5.1 非交互部署（推荐 CI）

```bash
export CLOUDFLARE_API_TOKEN=<你的 Pages API Token>
npm run cf:deploy
```

### 5.2 交互式部署

```bash
npx wrangler login
npm run cf:deploy
```

### 5.3 脚本化兜底

```bash
export CLOUDFLARE_API_TOKEN=<token>
npm run cf:deploy:ensure
```

## 6. 关键发布验收（上线后）

1. 打开以下地址，确认站点可访问：
   - https://aggieai.me
   - https://www.aggieai.me
2. 关键接口连通性：
   - `GET /api/v1/health`
   - `GET /api/v1/public/courses?limit=10`
   - `GET /api/v1/admin/ai-audit?role=platform`（需授权）
3. 运行二阶段冒烟：
   - `npm run stack:verify`

> 如你已在外部托管端手工启动后端，仅需快速复测可执行 `npm run verify:smoke`。
4. 记录 `request_id/trace_id` 可用，异常时对照服务端日志与 wrangler 请求追踪。

## 7. 变更记录与回滚

- 发布后若出现页面回滚问题：在 Pages 历史部署中恢复上一版本。
- 若出现数据面异常：
  - 优先在 Pages 下线高风险写接口（平台端）；
  - 检查 D1 与 R2 绑定是否失效；
  - 依次回退 Pages 与检查数据库迁移/脚本。
- 若 `R2` 或 `D1` 绑定名称在 Dashboard 与 `wrangler.toml` 不一致，先修正绑定后再发版。

## 8. 运行日志与调试（按需）

- 本地构建/部署日志：
  - `npm run web:build`
  - `/tmp/starmate-cf.log`（后台启动）
- 线上请求问题：
  - Cloudflare Dashboard → **Workers & Pages → Functions → Observability**
  - 聚焦 `trace_id` 与错误码 `code`（`401/403/500`）的聚合趋势

## 9. 关联文档

- `docs/phase2-implementation-plan-starmate-english.md`
- `docs/phase2-api-smoke-checklist.md`
- `docs/web-delivery-checklist.md`
- `docs/web-delivery-runbook.md`
- `docs/StarMate-dev-SOP-v4.1-CN.md`

## 10. 2026-06-06 生产发布执行记录（已完成）

- 发布命令：`CLOUDFLARE_API_TOKEN=... npm run cf:deploy:ensure`
- 生产环境：`https://25fc8ed5.starmate-english-saas.pages.dev`
- 绑定域名：`aggieai.me`、`www.aggieai.me`
- 绑定状态：
  - `aggieai.me` -> `active`
  - `www.aggieai.me` -> `active`
- 关键验收（线上）：
  - `https://aggieai.me/api/v1/health` -> `200`
  - `https://aggieai.me/api/v1/bootstrap?role=platform` -> `200`
  - `https://aggieai.me/api/v1/public/courses?limit=10` -> `200`
  - `https://aggieai.me/api/v1/me` -> `200`（携带登录 token）
  - `https://aggieai.me/api/v1/student/review/assignment` -> `403`（鉴权预期）
  - `https://aggieai.me/api/v1/parent/child/child_001/report-export` -> `403`（鉴权预期）
  - `https://aggieai.me/api/v1/admin/culture-wall` -> `401`（未登录预期）
  - `https://aggieai.me/api/v1/institution/payments?institutionId=inst-star` -> `200`（携带 founder token）
- 冒烟：`env -u http_proxy -u https_proxy -u all_proxy SMOKE_ALLOW_SKIP=true SMOKE_STRICT_AUTH=false node ./scripts/smoke-check.mjs https://aggieai.me` 通过（`12/12`）

## 11. 2026-06-07 文化墙聚合修复记录（已完成）

- 修复点：`functions/api/v1/_shared/dbLayer.js`
  - `normalizeCultureWallRow()` 中 `teacher` 与 `feedback` 结果补齐 `kind` 字段
  - 解决 `GET /api/v1/admin/culture-wall?kind=teacher` / `kind=feedback` 聚合时被静默丢弃的问题
- 重新发布：`https://cbacbc11.starmate-english-saas.pages.dev`
- 复测结果：
  - `GET /api/v1/admin/culture-wall?institutionId=inst-star&kind=teacher` -> `200`，`teachers` 可正确读回
  - `GET /api/v1/admin/culture-wall?institutionId=inst-star&kind=feedback` -> `200`，当前无反馈数据时返回空数组

## 12. 2026-06-07 机构线索路由修复与冒烟扩展（已完成）

- 修复点：`functions/api/v1/institution/leads.js`
  - `resolveInstitutionId()` 改为兼容 `Request` 对象和字符串 URL
  - 解决 `GET /api/v1/institution/leads` 在生产环境抛 `Invalid URL string` 的 500 异常
- 新增冒烟覆盖：
  - `GET /api/v1/institution/leads?institutionId=inst-star&limit=5`
  - `GET /api/v1/institution/lessons?institutionId=inst-star&limit=5`
  - `GET /api/v1/institution/students?institutionId=inst-star&limit=5`
  - `GET /api/v1/institution/teachers?institutionId=inst-star&limit=5`
  - `GET /api/v1/institution/payments?institutionId=inst-star&limit=5`
- 最近一次重新发布：`https://0ed978d7.starmate-english-saas.pages.dev`
- 复测结果：
  - `npm run verify:smoke`（`https://aggieai.me` 基准）通过（早期脚本版本 `17/17`）
  - 当前最终签收口径：`npm run stack:verify` 本地栈复测通过（`26/26`）

## 13. 2026-06-12 第一阶段收口发布记录（已完成）

- 发布命令：`npm run cf:deploy:ensure`
- Cloudflare Pages 项目：`starmate-english-saas`
- 新生产部署：`https://2ee6b3ff.starmate-english-saas.pages.dev`
- 部署 ID：`2ee6b3ff-0e07-461e-8e0c-3f2953561d94`
- 环境：Production
- 分支：`main`
- Source：`bfe0f7b`
- 绑定域名：
  - `starmate-english-saas.pages.dev`
  - `aggieai.me`
  - `www.aggieai.me`
- 发布后验收：
  - `bash ./scripts/smoke-check.sh https://aggieai.me` -> 通过（`26/26`）
  - `bash ./scripts/smoke-check.sh https://www.aggieai.me` -> 通过（`26/26`）
  - `bash ./scripts/smoke-check.sh https://2ee6b3ff.starmate-english-saas.pages.dev` -> 通过（`26/26`）
- 线上资源确认：
  - 生产域名与新部署均返回当前构建资源：`index-CoEmRXxF.js`、`index-DXDonB5e.css`
  - `GET https://2ee6b3ff.starmate-english-saas.pages.dev/api/v1/health` -> `200`，DB/R2 正常
- 说明：新部署刚创建后，预览域名首次冒烟曾出现短暂 API 404；等待 Cloudflare Pages Functions 传播完成后复测通过（`26/26`）。

## 14. 2026-06-12 只读角色文化墙请求修复发布记录（已完成）

- 修复点：
  - `src/main.jsx`：学生/家长等只读角色不再向成果馆传入 admin 刷新/上传函数。
  - `src/services/runtimeDataService.js`：启动数据加载时仅 `founder` / `platform` 角色请求 `/api/v1/admin/culture-wall`。
  - 解决线上学生/家长页面浏览器控制台出现 `401 /api/v1/admin/culture-wall?role=...` 的问题。
- 发布命令：`npm run cf:deploy:ensure`
- Cloudflare Pages 项目：`starmate-english-saas`
- 最新生产部署：`https://396c6265.starmate-english-saas.pages.dev`
- 部署 ID：`396c6265-77d2-40ff-a7cc-1101f1afdb5b`
- 环境：Production
- 分支：`main`
- Source：`bfe0f7b`
- 生产资源确认：
  - `https://aggieai.me` 当前构建资源：`index-DXIqghCc.js`、`index-DXDonB5e.css`
- 发布后 API 冒烟：
  - `bash ./scripts/smoke-check.sh https://396c6265.starmate-english-saas.pages.dev` -> 通过（`26/26`）
  - `bash ./scripts/smoke-check.sh https://aggieai.me` -> 通过（`26/26`）
  - `bash ./scripts/smoke-check.sh https://www.aggieai.me` -> 通过（`26/26`）
- 发布后浏览器点检：
  - 学生首页、课程中心、学习练习、个人中心：通过
  - 家长首页、家长学习练习只读视角：通过
  - 移动端学生首页：通过
  - 浏览器控制台：无 error/warning/pageerror
  - 浏览器网络：无 4xx/5xx/requestfailed
  - 结果文件：`output/playwright/phase1-live-browser-check.json`
