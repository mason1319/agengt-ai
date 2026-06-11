# Aggie速记英语 AI 经营平台

## 项目定位

面向 K12 英语教培机构（小学一年级到高三）的 SaaS 化经营平台原型。

核心目标是用最少摩擦帮创始人、老师、家长和学生“少扯皮、少内耗、少重复劳动”，先跑通可演示前端原型。

## 现阶段范围（第一版原型）

- 支持真实登录（/admin 可使用账号密码）
- 已支持 Cloudflare Pages 一体化部署（静态站点 + API 桩路由）
- 不包含数据库建表与迁移执行（保留 schema 预留）
- AI 功能先模拟输出，不接真实模型 API
- 输出交付：前端原型、`README`、`wrangler.toml`、`schema.sql`

## 当前可用功能（模拟数据）

- **角色切换**：创始人 / 老师 / 家长 / 学生 / 平台运营
- 创始人：今日必须处理、续费预警、本月收入、在读学员、今日消课、新试听线索
- 老师：今日课程、授权学生、一键消课、课堂记录、AI 反馈与练习题模拟
- 家长：成长卡、本周学习、进步与待加强、剩余课时、阶段反馈
- 学生：今日任务、单词星球、语法关卡、阅读闯关、错题复活、积分徽章
- 平台端：机构列表、试用/到期状态、套餐（月付/年付）与 AI 用量约束展示、开通/延期/停用入口
- AI 智能体中心：招生、续费、沟通、练习生成等能力清单（模拟）
- 套餐页：体验版 / 基础版 / 标准版 / 专业版（含月付与年付展示）
- 文化墙：教学视频、教学图片、老师上墙、家长与学生反馈（支持演示上传）

## 快速启动（只走网页）

```bash
cd /Users/mason/英语系统
npm install
npm run web:dev
```

### 真实登录启动（推荐）

```bash
cd /Users/mason/英语系统
npm install
cp .env.example .env
# 本地先导入 schema（含管理员/角色种子）
wrangler d1 execute starmate_english --local --file=schema.sql
npm run stack:start:proxy
```

启动后访问：
- `http://127.0.0.1:8787/admin`

可直接登录的默认账号：
- platform / Platform@123
- founder / Founder@123
- teacher / Teacher@123
- parent / Parent@123
- student / Student@123

### 一键启动（推荐）：启动前端 + 后台 API（VPN 场景友好）

```bash
cd /Users/mason/英语系统
npm install
npm run ports:free
npm run stack:start:proxy
```

- 主服务（含 API）：
  - `http://127.0.0.1:8787/?role=platform`
- 后台健康/自检：`http://127.0.0.1:8787/api/v1/health`
- 平台机构列表 API（请先登录拿 token，再访问）：`http://127.0.0.1:8787/api/v1/admin/institutions`
- 备用前端（无 Cloudflare Pages 时）：`http://127.0.0.1:8080/?role=platform`

后台保活版（后台与前端都脱离当前终端进程）：

```bash
npm run ports:free
npm run stack:background:proxy
```

命令行里如果你复制粘贴访问地址，避免 `zsh` 的通配问题请使用完整引号：

```
http://127.0.0.1:8787/?role=platform
```

### 小白执行版（先看 Web）

```bash
npm install
npm run web:dev
npm run web:build
```

验收自检（推荐直接执行）：

```bash
npm install
npm run stack:start:proxy
npm run verify:smoke
```

- 或一步到位：

```bash
npm install
npm run stack:verify
```

- 自检返回 `Smoke check passed` 即说明后端接口可用。
- 如你只验前端（不含 API），可直接用 `npm run web:dev` 打开 `http://localhost:5173`。

网页验收文档：`docs/web-delivery-checklist.md`

- 先按前 3 条即可完成网页运行：`npm install`、`npm run dev`、`npm run build:web`。
- iOS/Android 壳体是后续阶段，验收网页稳定后再执行 `mobile:*` 脚本。

### 预览和构建

```bash
npm run preview   # 本地预览构建产物
npm run web:build # 生成 dist 后，可交付给 Cloudflare Pages
```

### 以后再开壳（不影响网页）

```bash
npm run mobile:bootstrap
npm run mobile:sync
npm run mobile:open:ios
npm run mobile:open:android
```

```bash
npm run mobile:bootstrap:ios    # 只建/同步 iOS 壳
npm run mobile:bootstrap:android # 只建/同步 Android 壳
```

- 手机网页（H5）开发/真机验证建议：
  - 本地命令默认监听 `0.0.0.0`，同局域网手机可通过电脑内网 IP 访问
  - 真机优先在宽度 360/375/412/390 像素下验收，确保无横向溢出
  - 页面优先按「角色切换、按钮可点、卡片滚动、弹窗与提示」验收
  - 已预置 `public/manifest.webmanifest`，可直接用于 PWA 化扩展

## 跨端扩展说明（iOS / Android / 微信小程序）

当前原型采用「Web 优先」设计，后续可按以下方式平滑扩展：

### 1）iOS App、安卓 App（Capacitor 兜底改造）
- 先用现有 Web 产物（`npm run build`）作为统一内核；
- 再用 Capacitor 包装（iOS/Android 双端）生成原生壳；
- 推荐共用页面路由与交互逻辑，原生层只做：
  - 启动页与状态栏颜色
  - 推送能力（待办/续费预警）
  - 上传、相册、电话、通讯录等权限接入（后续阶段）
- 优势：不会影响当前页面结构，后续只新增少量原生桥接代码。

### 2）微信小程序
- 短期：H5 小程序 Webview 方式先行（最快验证业务）；
- 中期：抽离 API 层后，逐步迁移到 Taro/uni-app（共享同一套数据契约）；
- 关键前置条件：
  - 统一接口地址（后续接 Pages Functions）
  - 字段脱敏规则前置到服务端
  - 角色权限在服务层兜底校验，避免前端绕过

### 3）H5 手机网页
- 已按响应式做了第一层适配，后续阶段建议开启：
  - PWA 离线缓存（课程卡片/课程说明）；
  - 添加 `manifest` 与 `service worker`；
  - 登录态与多端设备通知统一打通（消息提醒渠道统一配置）。

### 4）后续修改友好性（你后续最容易改的方式）
- 约定统一配置入口，不在页面组件里写死套餐、角色文案、功能列表；
- 保留「UI文案 / 权限 / 套餐 / 平台动作」四类配置文件；
- 新增端能力时只调整入口配置，不重写核心组件；
- 先把接口换到真实服务端，界面逻辑可继续复用。

## 脚本说明

- `npm install`：安装依赖
- `npm run dev`：本地启动
- `npm run web:fixed`：前端固定端口启动（`127.0.0.1:4373`）
- `npm run stack:start`：一键启动（Cloudflare 前端 + 后台 API，默认 `8787`）
- `npm run stack:background`：后台保活启动（可退出终端，服务继续挂起）
- `npm run ports:free`：清理占用的 `4373` / `8787` 端口（启动前用于排障）
- `npm run build`：生产构建（输出 `dist`）
- `npm run build:web`：生成网页部署产物（优先使用）
- `npm run web:dev`：网页启动（同 `npm run dev`）
- `npm run web:build`：网页构建（同 `npm run build:web`）
- `npm run web:start`：网页启动别名（同 `npm run web:dev`）
- `npm run verify:smoke`：本地 API 自检（`/health`、`/bootstrap`、机构列表、AI 用量/审计）
- `npm run stack:verify`：后台启动（保活）+ 自检，一步到位
- `npm run web:deliver`：网页部署包输出（输出 `dist`，可直接发布到 Pages）
- `npm run web:ship`：一键生成交付目录（`delivery/web/<时间戳>/`，含交付说明）
- `npm run stack:start:proxy`：一键启动（含 API）+ VPN 环境友好（推荐）
- `npm run stack:background:proxy`：一键后台保活 + VPN 环境友好（推荐）
- `npm run web:local:8080:proxy`：纯前端预览（无 API，端口 8080，VPN 友好）
- `npm run mobile:*`：后续在网页验收通过后再开启

## 网页最终交付（可直接复制）

```bash
cd /Users/mason/英语系统
npm install
npm run web:dev
npm run web:ship
```

交付说明请按以下文件执行：
- `docs/web-delivery-checklist.md`
- `docs/web-delivery-runbook.md`
- `docs/web-delivery-screenshot-guide.md`
- `docs/web-delivery-client-note.md`
- `docs/web-delivery-requirement-map.md`
- `docs/web-delivery-delivery-index.md`
- `docs/web-delivery-to-customer-message.md`
- `docs/web-delivery-ready-to-send.md`

阶段交付说明：`docs/web-delivery-summary.md`

验收签字模板：`docs/web-delivery-signoff-template.md`

老板汇报版（1页）：`docs/web-delivery-manager-brief.md`

汇报话术（2分钟）：`docs/web-delivery-2min-script.md`

## 部署说明（Cloudflare）

- `wrangler.toml` 已提供 Pages + D1 + R2 的预留配置
- 部署运行时标准与绑定清单见：[docs/CLOUDFLARE_DEPLOYMENT.md](/Users/mason/英语系统/docs/CLOUDFLARE_DEPLOYMENT.md)
- 当前已支持一键上线：
  - `npm run cf:deploy`：构建后调用 `wrangler pages deploy dist`
  - `npm run cf:dev`：构建后调用 `wrangler pages dev dist`
- 非交互环境部署（CI 或无浏览器时）：
  - `export CLOUDFLARE_API_TOKEN=<你的 API Token>`
  - `npm run cf:deploy`
- 预留 `vars`：
  - `APP_ENV`
  - `AI_MODE`
  - `AI_PROVIDER`
  - `AI_BASE_URL`
  - `AI_MODEL`
  - `PLAN_CHECKPOINT`
  - `JWT_SECRET`
  - `ALLOW_DEMO_LOGIN`
- Pages Function 路径：
  - `/api/v1/bootstrap`（前端启动配置）
  - `/api/v1/admin/institutions`（平台运营机构管理）
  - `/api/v1/health`（健康检查）
  - `/api/v1/me`（会话回读）
  - `/api/v1/auth/login`（JWT/示例登录）
  - `/api/v1/portal`（角色面板初始化）
- 未来阶段按 `local / preview / production` 分环境注入对应变量即可

## 环境变量控制（Mock/API）

默认本地已切到 API 模式（支持真实鉴权），默认可在 `.env` 查看：

```bash
VITE_DATA_SOURCE=api
VITE_API_BASE=/api
VITE_API_TIMEOUT_MS=4000

# 后端模型开关：mock（默认）或 provider/real
AI_MODE=mock
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_DAILY_LIMIT=5000
```

- `mock`：直接走本地 `seedData`
- `api`：启动时请求 `GET /api/v1/bootstrap`

- `AI_MODE=provider` 或 `AI_MODE=real` 时，后端尝试调用外部模型；未配置密钥会自动回退到 mock。
- `AI_PROVIDER` 可写任意 OpenAI 兼容提供方标识，真正生效的关键是 `AI_BASE_URL` 与 `AI_API_KEY`。

### 国内模型接入模板

如果后续要接国内 OpenAI 兼容模型，只改这些：

```bash
AI_MODE=provider
AI_PROVIDER=your-provider-name
AI_BASE_URL=https://your-provider.example/v1
AI_MODEL=your-model-name
wrangler secret put AI_API_KEY
```

- `AI_PROVIDER` 只是标识名，前端和后端都不依赖具体厂商名。
- `AI_BASE_URL` 必须是该厂商的 OpenAI 兼容接口地址。
- `AI_MODEL` 填该厂商实际可用模型名。

### 国内模型预设速查

如果你不想自己拼 URL，可以直接按下面的预设填：

| 预设 | `AI_PROVIDER` | `AI_BASE_URL` | `AI_MODEL` |
| --- | --- | --- | --- |
| DeepSeek | `deepseek` | `https://api.deepseek.com` | `deepseek-chat` |
| Qwen | `qwen` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| Moonshot | `moonshot` | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| 豆包 | `doubao` | `https://ark.cn-beijing.volces.com/api/v3` | `ep-202406` |
| 智谱 | `zhipu` | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-plus` |

- 这些都是 OpenAI 兼容风格接入，真正生效的还是 `AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL`。
- `AI_PROVIDER` 只是页面和日志里的标识名，不会锁死厂商。

服务端密钥建议通过 `wrangler secret` 注入：

```bash
wrangler secret put AI_API_KEY
```

### 鉴权登录（Cloudflare API）

真实登录入口（默认启用）：

- `POST /api/v1/auth/login`
  - 请求体：`{ "role": "platform|founder|teacher|parent|student", "username": "xxx", "password": "xxx" }`
- `GET /api/v1/me?token=<jwt>`
- `GET /api/v1/portal?token=<jwt>`（或加 `x-demo-role` 前提是 `ALLOW_DEMO_LOGIN=true`）
- `GET /api/v1/bootstrap?token=<jwt>`（或加 `role` 前提是 `ALLOW_DEMO_LOGIN=true`）

- `GET /api/v1/health`（DB/R2 绑定检查）
- `GET /api/v1/admin/institutions`（平台运营：机构列表）
- `PATCH /api/v1/admin/institutions`（平台运营：机构状态/套餐更新）
- `GET /api/v1/admin/institutions?institutionId=<id>`（平台运营：机构详情）
- `GET /api/v1/institution/students`（机构：学员列表/新增/更新）
- `GET /api/v1/institution/teachers`（机构：教师列表/新增/更新）
- `GET /api/v1/institution/lessons`（机构：课时记录/新增/更新）
- `GET /api/v1/institution/leads`（机构：试听线索列表/新增/更新）
- `GET /api/v1/institution/payments`（机构：收费记录）
- `GET /api/v1/institution/permissions`（机构：用户权限列表）
- `POST /api/v1/institution/permissions`（机构：授予用户权限）
- `DELETE /api/v1/institution/permissions`（机构：撤销用户权限）
- `GET /api/v1/admin/ai-audit`（平台：AI 审计日志）
- `GET /api/v1/admin/ai-usage`（平台：AI 用量汇总；支持 `days/startAt/endAt/institutionId/includeUsers`）

权限码（permissions）白名单（`POST/DELETE /api/v1/institution/permissions`）：
- `STUDENT_VIEW`, `STUDENT_EDIT`
- `TEACHER_VIEW`
- `LESSON_VIEW`, `LESSON_CREATE`, `LESSON_EDIT`
- `LEAD_VIEW`, `LEAD_EDIT`
- `PAYMENT_VIEW`, `PAYMENT_EDIT`
- `WALL_VIEW`, `WALL_UPLOAD`
- `PERMISSION_VIEW`, `PERMISSION_GRANT`
- `AI_AGENT_USE`, `AI_AUDIT_VIEW`

权限接口联调示例（先登录取 token）：

```bash
# 查询机构权限
curl -X GET "http://127.0.0.1:8787/api/v1/institution/permissions?institutionId=inst-star" -H "Authorization: Bearer <token>"

# 给用户授权
curl -X POST "http://127.0.0.1:8787/api/v1/institution/permissions?institutionId=inst-star" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"u_teacher_01","permissionCode":"LESSON_CREATE"}'

# 撤销授权
curl -X DELETE "http://127.0.0.1:8787/api/v1/institution/permissions?institutionId=inst-star" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"u_teacher_01","permissionCode":"LESSON_CREATE"}'

# AI 用量汇总（最近 30 天）
curl -X GET "http://127.0.0.1:8787/api/v1/admin/ai-usage?days=30&limit=20" \
  -H "Authorization: Bearer <token>"

# 机构级 AI 用量明细（含 Top 用户）
curl -X GET "http://127.0.0.1:8787/api/v1/admin/ai-usage?institutionId=inst-star&days=30&includeUsers=true&userLimit=10" \
  -H "Authorization: Bearer <token>"
```

### D1 初始化（本地 / 远端）

- `npm run db:push:local`：在本地 D1 执行 `schema.sql`（含基础种子）
- `npm run db:seed:local`：同上，便于反复联调
- `npm run db:push`：在 Cloudflare 远端 D1 执行 `schema.sql`
- `npm run db:seed`：同上，执行远端种子

（远端执行前请先完成 `wrangler d1 create starmate_english` 并在环境变量中设置对应 D1 ID）

演示 token（`ALLOW_DEMO_LOGIN=true` 时可与 Authorization `Bearer` 一起使用）：
- founder: `starmate_founder_demo_token`
- teacher: `starmate_teacher_demo_token`
- parent: `starmate_parent_demo_token`
- student: `starmate_student_demo_token`
- platform: `starmate_platform_demo_token`

## 与架构/PRD 文档

- PRD：`docs/phase1-prd-starmate-english.md`
- 架构：`docs/phase1-architecture-starmate-english.md`
- 跨端计划：`docs/phase1-cross-platform-guide.md`
- 跨端执行手册：`docs/phase1-cross-platform-ops.md`
- 配置化入口（后续改动友好）：`src/config/appConfig.js`

## 数据模型（预留与可落库）

- `schema.sql` 已补齐机构/用户/课程/课时/收费/线索/AI 用量表及索引，支持与前端 bootstrap 的真实数据回填。

## 文化墙怎么加（第一阶段演示）

- 入口：`src/main.jsx` 的 `CultureWallSection`
- 数据源：`src/seedData.js` 的 `cultureWall`，包含 `videos / photos / teachers / feedback`
- 上传按钮逻辑在前端本地预览（模拟）：
  - 角色 `创始人` / `老师` / `平台运营` 可上传
  - 上传后只写到前端状态，不落库，适合当前第一阶段演示
- 下一阶段迁移到真实环境时：
  - 把 `appendUpload` 改为请求 `/api/v1/wall/upload`
  - 视频与图片写入 `R2`
  - 文化墙元数据写入 `D1` 的 `wall_posts`
