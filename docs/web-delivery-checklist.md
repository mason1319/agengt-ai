# Web 版交付验收清单（Aggie速记英语）

## 只做网页版（当前阶段）

### 0. 准备
- 进入项目目录：`cd /Users/mason/英语系统`
- 安装依赖：`npm install`

### 当前可交付结论
- 生产域名已可访问：`https://aggieai.me`、`https://www.aggieai.me`
- 本地构建已通过：`npm run web:build`
- 学生、老师、家长、创始人四个角色页已抽检通过
- 页面课程展示已收口：课程名、班型、费用、时间均可读
- 平台智能体中心导出标准已固定：`docs/agent-center-export-standard.md`

### 1. 启动
- 运行：`npm run web:dev`
- 打开：`http://localhost:5173`
- 手机同网段访问：例如 `http://192.168.x.x:5173`

如果你要一并启动后端 API（推荐）：
- 运行：`npm run stack:start:proxy`
- 打开：`http://127.0.0.1:8787`（网页）
- API 自检：`http://127.0.0.1:8787/api/v1/bootstrap?role=platform`

### 2. 基础可视化验收
- 首页有内容，不空白。
- 顶部角色切换按钮全部可见、可点击。
- 所有功能区域切换后页面内容有变化。
- 没有横向滚动条（手机宽度也不应出现）
- 云端正式地址可访问：
  - `https://b2f4b9fe.starmate-english-saas.pages.dev`
  - `https://aggieai.me`
  - `https://www.aggieai.me`

### 3. 核心业务点验收
- 创始人视图：今日必须处理、续费预警、在读学员、本月收入、今日消课、新试听线索可见。
- 老师视图：今日课程、授权学生、一键消课、课堂记录、AI 生成反馈/作业、家长联系方式脱敏。
- 家长视图：成长卡、本周学习、进步/需加强、剩余课时、阶段报告。
- 学生视图：今日任务、单词、语法、阅读、错题复活、积分徽章。
- 平台视图：试用到期、套餐切换逻辑、AI用量与上限状态。
- 平台视图中的 AI 审计功能必须可用：
  - 可见 `AI 审计日志` 区块
  - 可调节每页条数、分页加载更多
  - 可输入/清空以下筛选：机构、动作、决策、用户ID、客户端IP、开始时间、结束时间
  - 列表可导出 CSV
- 页面不得出现明显 `未命名`、`班型未知`、`系统待确认` 这类占位词

### 4. API 自检（可选）
- `GET /api/v1/admin/ai-audit?role=platform` 返回 `success: true` 结构
- 关键参数都支持：`institutionId`、`action`、`decision`、`userId`、`clientIp`、`startAt`、`endAt`、`limit`、`offset`
- 若数据库为空，列表可显示 0 条（不是异常）
- 额外建议统一跑第二阶段冒烟清单（含全角色 auth + RBAC）：
  - `docs/phase2-api-smoke-checklist.md`
- 部署前建议先按运行时清单核对：
  - `docs/CLOUDFLARE_DEPLOYMENT.md`

本阶段推荐直接执行一键验收（启动后端 + 全量自检）：

```bash
npm run stack:verify
```

如需与当前脚本链路保持兼容，也可执行：

```bash
npm run verify:smoke:auto
```

### 5. 测试页面与构建
- 运行：`npm run web:deliver`
- 检查无报错退出，`dist` 目录生成。

### 5.1 一键打包（交付目录）
- 运行：`npm run web:ship`
- 会生成：`delivery/web/StarMate-English-YYYYMMDD_HHMMSS/`
- 目录内含 `.delivery-note.txt`，用于展示交付时间与说明。

### 6. 线上发布（本阶段）
- 运行：`CLOUDFLARE_API_TOKEN=<你的 Token> npm run cf:deploy`
- 完成后再次访问 `https://aggieai.me` 与 `https://www.aggieai.me`

### 7. 提交给你的小白交付口径
- 若网页以上项全部通过，可继续执行壳体链路：
  - `npm run mobile:bootstrap`
  - `npm run mobile:sync`
- `npm run mobile:open:ios`（需 macOS + Xcode）
- `npm run mobile:open:android`（需 Android Studio）

### 8. Cloudflare 上线前最终接口核对
- 登录链路：
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/me`
- 学生链路：
  - `GET /api/v1/student/today-path`
  - `POST /api/v1/student/voice-practice/assess`
  - `GET /api/v1/student/review/summary`
  - `GET /api/v1/student/review/history`
  - `GET /api/v1/student/review/mistakes`
  - `GET /api/v1/student/lesson-account`
- 老师链路：
  - `GET /api/v1/teacher/students`
  - `GET /api/v1/teacher/exceptions`
  - `GET /api/v1/teacher/courses`
  - `POST /api/v1/teacher/courses/:courseId/attendance`
- 家长链路：
  - `GET /api/v1/parent/child/:id/summary`
  - `GET /api/v1/parent/child/:id/courses`
  - `GET /api/v1/parent/child/:id/lesson-account`
  - `GET /api/v1/parent/child/:id/payment-records`
- 创始人链路：
  - `GET /api/v1/founder/cockpit`
  - `GET /api/v1/founder/leads`
  - `GET /api/v1/founder/courses`
  - `GET /api/v1/founder/payment-records`
  - `GET /api/v1/founder/lesson-accounts`
  - `GET /api/v1/founder/attendance-records`
- 平台链路：
  - `GET /api/v1/admin/ai-audit`
  - `GET /api/v1/platform/organizations`
  - `POST /api/v1/platform/organizations`
- 核对规则：
  - 任一入口按钮必须能对应到上述接口之一。
  - 任一按钮如无接口，不保留在页面。
  - 页面可见数据必须能从后端返回，不能依赖硬编码假数据。
  - 上线前先在本地预览和 `/admin`、学生、老师、家长、创始人、平台六个角色页逐个抽检。

### 当前验收建议结论
- 若以上项全部通过，可直接进入下一阶段的真实登录与数据写入。
- 若需继续保守推进，优先补强 `D1` 写入和真实 AI 接口。
- 平台智能体导出若要做审计/复核，请优先遵循 `docs/agent-center-export-standard.md`
