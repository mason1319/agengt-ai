# StarMate Phase 2 日志（内部版）

## 2026-06-12

- 最新复测记录（Phase2 首页 AI 咨询回执收口）：`home.send-ai-reply` 补齐可见输入区与失败提示
  - 修复点：公开咨询区新增回执线索ID与回执内容输入区，提交后可发送 AI 回执。
  - 修复点：缺少线索ID或回执内容时，页面会明确提示先提交咨询或补全内容。
  - 结论：`home.send-ai-reply` 已可视为闭环，不再作为未闭环控件保留。
  - 验证：`npm run typecheck` ✅
  - 验证：`npm run build` ✅
  - 验证：`npm run stack:verify` ✅（35/35）

- 最新复测记录（Phase2 创始人收费记录筛选与导出收口）：`founder.payment-records` 已闭环
  - 代码现状：收费记录支持学员 / 课程 / 日期筛选，CSV 导出与页面字段一致。
  - 结论：`founder.payment-records` 当前按既有实现视为闭环，清单仅保留收口说明。

- 最新复测记录（Phase2 课程创建抽屉收口）：`founder.courses.create` 已具备抽屉式创建/编辑
  - 代码现状：课程页已提供“新建课程”入口、课程卡点击编辑、表单保存后刷新课程库与公开课程列表。
  - 结论：`founder.courses.create` 当前按既有实现视为闭环，清单仅保留收口说明。

- 最新复测记录（Phase2 平台机构策略页收口）：`platform.practice` 改为只读策略总览
  - 修复点：平台机构方案页不再展示套餐购买语义，改为只读策略总览、状态规则和机构样例。
  - 修复点：页面复用 `orgStatusDefaults` / `orgActionsByStatus` / `organizations`，不新增编辑入口。
  - 结论：`platform.practice` 已可视为闭环，不再作为未闭环控件保留。
  - 验证：`npm run typecheck` ✅
  - 验证：`npm run build` ✅
  - 验证：`npm run stack:verify` ✅（35/35）

- 最新复测记录（Phase2 首页公开课程选课闭环）：选中课程会进入咨询与预约口径
  - 修复点：选中试听课程后，咨询与预约表单同时展示课程摘要、规则和课程 ID。
  - 修复点：咨询提交与试听预约请求都携带当前选中课程信息。
  - 结论：`home.select-public-course` 已可视为闭环，不再作为未闭环控件保留。

- 最新复测记录（Phase2 公开课程详情收口）：公开课程页与首页选课摘要统一补齐
  - 修复点：公开课程页新增课程详情摘要，展示上课日期、到课规则和保留规则。
  - 修复点：首页公开课程选中态同步展示同口径课程详情。
  - 结论：`public.courses.detail` 已可视为闭环，不再作为未闭环控件保留。
  - 验证：`npm run typecheck` ✅
  - 验证：`npm run build` ✅
  - 验证：`npm run stack:verify` ✅（35/35）

- 最新复测记录（Phase2 个人中心课时账户同步闭环）：父/学生口径一致，清单收口
  - 修复点：个人中心课时账户区已保留“数据来源 / 最近同步 / 重新同步”提示条，父端与学生端分别标注对应课时账户接口。
  - 修复点：同步后更新时间戳与状态回写，便于确认当前展示口径。
  - 结论：`profile.quick.lesson-account` 已可视为闭环，不再作为未闭环控件保留。

- 最新复测记录（Phase2 老师点名扣减回显增强）：补齐扣减前后余额与账户 ID
  - 修复点：老师点名成功提示增加扣减前余额、扣减后余额和课时账户 ID。
  - 修复点：清单同步更新为“已补扣减前后余额与账户回显”。
  - 验证：待跑本轮最小回归。

- 最新复测记录（Phase2 课时账户调整审计收口）：补齐创始人课时调整入口与最近记录展示
  - 修复点：创始人课时账户面板增加调整表单，要求填写学员ID、调整课时、金额和原因。
  - 修复点：调整后刷新课时账户列表，并在面板中展示最近一条调整记录的原因。
  - 修复点：服务层补 `POST /api/v1/founder/lesson-accounts` 封装，模拟模式也返回 reason。
  - 验证：`npm run typecheck` ✅
  - 验证：`npm run build` ✅
  - 验证：`npm run stack:verify` ✅（35/35）

- 最新复测记录（Phase2 首页续费风险闭环）：补齐风险扫描到跟进任务的落点
  - 修复点：`renewal_risk_scan` 结果增加 `studentId / grade / hoursLeft / priority / action`，首页续费风险卡支持把高风险学员一键转成 `intervention` 跟进任务。
  - 修复点：复用现有 `teacher/student/{studentId}/intervention` 写入链路，不新增独立跟进表。
  - 修复点：风险扫描区增加高风险学员明细和“生成风险跟进”按钮，生成结果会回写当前操作日志。
  - 验证：`npm run typecheck` ✅
  - 验证：`npm run build` ✅
  - 验证：`npm run stack:verify` ✅（35/35）

- 最新复测记录（Phase2 试听预约课程摘要与线索转化失败分段）：新增 2 项 P1-4 验收
  - 新增用例：`public trial booking submit` 增加 `courseSummary.id` 与提交 `courseId` 一致性断言。
  - 新增用例：`founder lead convert returns segmented course enrollment failure`。
  - 追加用例：`founder lead convert returns segments for enrollment attempt`，覆盖有效课程报名写入异常不得冒泡为 500。
  - 修复点：试听预约 API 返回 `courseSummary`；创始人线索转化返回 `segments`，阶段覆盖学生创建、课时账户、收费记录、课程报名；默认首页展示公开课程试听摘要；创始人首页展示转化分段状态。
  - 热修点：课程报名和收费记录写入失败时返回 `converted=false`、`failedStage` 和对应失败段。
  - 验证：`npm run validate:contracts` ✅（77/77）
  - 验证：`npm run typecheck` ✅
  - 验证：`npm run build` ✅
  - 验证：`bash ./scripts/smoke-check.sh` ✅（32/32）
  - Playwright：`output/playwright/p1-4-public-trial-summary.png`、`output/playwright/p1-4-founder-convert-segments.png`
  - PR：GitHub PR #6 已合并，Source `db6d445`；热修 PR #7 已合并，Source `c2e94c1`
  - Cloudflare 发布：`npm run cf:deploy:ensure` ✅，最终生产部署 `https://71e8c048.starmate-english-saas.pages.dev`
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://71e8c048.starmate-english-saas.pages.dev` ✅（32/32）
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://aggieai.me` ✅（32/32）
  - 线上严格验收：`SMOKE_TIMEOUT_MS=30000 SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://www.aggieai.me` ✅（32/32，默认超时首次为 31/32，增大单请求超时后通过）
- 最新复测记录（Phase2 课时调整审计与扣减明细）：新增 2 项课时审计/消课明细验收
  - 新增用例：`founder lesson account adjustment requires reason`
  - 新增用例：`teacher attendance returns deduction detail`
  - 修复点：创始人课时调整无原因返回 400；老师点名消课返回 `hoursDeducted`、`beforeRemaining`、`afterRemaining`、`accountId`；老师端成功提示展示扣减和剩余课时。
  - 验证：`npm run validate:contracts` ✅（77/77）
  - 验证：`npm test` ✅（30/30）
  - 验证：`npm run stack:verify` ✅（30/30）
  - 验证：`npm run build`、`npm run lint`、`npm run typecheck`、`npm run audit:deps`、`npm run audit:dead-code`、`npm run audit:security` ✅
  - PR：GitHub PR #5 已合并，Source `a0665b5`
  - Cloudflare 发布：`npm run cf:deploy:ensure` ✅，新生产部署 `https://2eaf4998.starmate-english-saas.pages.dev`
  - 线上验收：`bash ./scripts/smoke-check.sh https://2eaf4998.starmate-english-saas.pages.dev` ✅（30/30）
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://aggieai.me` ✅（30/30）
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://www.aggieai.me` ✅（30/30）
- 最新复测记录（Phase2 老师练习下发到学生任务闭环）：新增 1 项老师练习下发到学生今日任务验收
  - 新增用例：`teacher exercise visible to student today path`
  - 修复点：新增 `POST /api/v1/teacher/student/{studentId}/exercise`，老师端 AI 练习生成后写入 `student_tasks.task_type=exercise`，学生 `/api/v1/student/today-path` 可读取同一任务。
  - 验证：`npm run validate:contracts` ✅（77/77）
  - 验证：`npm test` ✅（28/28）
  - 验证：`npm run stack:verify` ✅（28/28）
  - 验证：`npm run build`、`npm run audit:deps`、`npm run audit:dead-code`、`npm run audit:security` ✅
  - PR：GitHub PR #4 已合并，Source `6928f8d`
  - Cloudflare 发布：`npm run cf:deploy:ensure` ✅，新生产部署 `https://b9432c95.starmate-english-saas.pages.dev`
  - 线上验收：`bash ./scripts/smoke-check.sh https://b9432c95.starmate-english-saas.pages.dev` ✅（28/28）
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://aggieai.me` ✅（28/28）
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://www.aggieai.me` ✅（28/28）
- 最新复测记录（Phase2 老师反馈家长可见闭环）：新增 1 项老师反馈落库到家长摘要验收
  - 新增用例：`teacher feedback visible to parent summary`
  - 修复点：老师端 AI 反馈生成后 PATCH `/api/v1/institution/lessons` 写入 `lessons.parent_feedback`；家长孩子 summary 返回 `lessonFeedback` / `recentFeedback`；家长首页展示“最近课堂反馈”。
  - 验证：`npm run validate:contracts` ✅（76/76）
  - 验证：`npm test` ✅（27/27）
  - 验证：`npm run stack:verify` ✅（27/27）
  - 验证：`npm run build`、`npm run audit:deps`、`npm run audit:dead-code`、`npm run audit:security` ✅
  - PR：GitHub PR #3 已合并，Source `7c2d69e`
  - Cloudflare 发布：`npm run cf:deploy:ensure` ✅，新生产部署 `https://04ec3fee.starmate-english-saas.pages.dev`
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://aggieai.me` ✅（27/27）
  - 线上严格验收：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://www.aggieai.me` ✅（27/27）
  - 备注：曾并发跑多个线上 smoke 触发 `www.aggieai.me` Cloudflare 1015 限流；改为顺序降频后严格模式通过。
- 2026-06-12 16:00（线上复核）：绑定域名后的全链路再次收口
  - 命令：`bash ./scripts/smoke-check.sh https://aggieai.me && bash ./scripts/smoke-check.sh https://www.aggieai.me`
  - 结果：`Smoke check passed: 26/26 checks`（两域名）
  - 说明：主链路（公开咨询/课程/试听/登录/学生/老师/家长/创始人）均可复测通过。
- 2026-06-12 16:02（线上加测）：`bash ./scripts/smoke-check.sh https://4e87146b.starmate-english-saas.pages.dev`
  - 结果：`Smoke check passed: 26/26 checks`
  - 说明：预览域名与自定义域一致，接口闭环未受域名路由影响。
- 2026-06-12 16:03（部署状态）：Cloudflare Pages 与 D1 对接验证
  - 命令：`wrangler pages project list`
  - 结果：项目 `starmate-english-saas` 已挂载域名 `aggieai.me`、`www.aggieai.me`
  - 备注：远端 D1 已通过 `/api/v1/public/courses` 返回课程数据，消除“试听预约课程为空”缺口。
- 09:00（约）: 继续 Phase 2 收口起点，确认 `scripts/smoke-check.mjs` 与 `docs/phase2-api-smoke-checklist.md` 已可执行化；
  - 验证：`npm run validate:contracts`（通过）
  - 验证：`npm run stack:verify`（17/17）
  - 说明：当时脚本版本为 17 项，已用于最初阶段验收。
- 14:44:06（复测）: 收口复测（严格模式）
  - 命令：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false npm run stack:verify`
  - 结果：通过，17/17
  - 备注：冒烟 meta 显示 tokenSource 全为 demo-login，strictAuth=true，allowSkip=false
- 09:21（最终收口复测）: 当前脚本版本本地栈复测
  - 命令：`npm run stack:verify`
  - 结果：通过，26/26
  - 备注：当前最终签收口径以 26/26 为准；17/17 为早期脚本版本历史记录。
- 16:30（续步）: Phase 2 统一校验项版本后复测
  - 命令：`npm run validate:contracts && npm run stack:verify`
  - 结果：通过，76/76 与 20/20
  - 说明：当前验证链条已更新为 20 项接口校验，覆盖 `/api/v1/admin/*` 与 `/api/v1/institution/*`关键域。
- 2026-06-12 结论：P1 闭环化入口与日志口径完成；继续进入 P1 后续“实际问题修复”与前端/接口控件一致性抽检。
- 14:53（复核后）: P1 支持项再验证
  - `npm run audit:deps` ✅（依赖一致）
  - `npm run audit:dead-code` ✅（无空源文件）
  - `npm run audit:security` ✅（无明显敏感文本）
- 阶段备注：P1 当前不再追加阻塞项，维持 P2 继续排期。
- 15:00（构建回归）: `npm run build` ✅（Vite build 通过）
- 14:49（继续）：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false npm run stack:verify`
  - 结果：通过，20/20
  - 新增覆盖：`/api/v1/admin/ai-usage`、`/api/v1/admin/ai-audit`、`/api/v1/founder/leads`
- 14:52（阶段性收口）：`npm run validate:contracts && npm run stack:verify`
  - 验证通过：`validate-contracts` 76/76；`stack:verify` 20/20（默认模式）
  - 注意：本次保持 `strictAuth=false`，`allowSkip=true`
- 15:20（映射一致性扫描）：执行 `/api/v1` 映射一致性核对（ui-control map / openapi / 代码内显式调用）
  - ui-control 映射路径：52
  - openapi 路径：52
  - 代码内显式 `/api/v1` 字符串：0（当前前端通过 API 客户端配置化组装）
  - 缺口结果：`MISSING_IN_OPENAPI=0`、`UNMAPPED_IN_UI_MAP=0`
  - 阶段结论：映射口径无新增缺口；后续聚焦按钮交互状态、空态提示与越权兜底动作一致性。

- 2026-06-12 15:30:17(续): 继续 Phase 2 收口并做本地页面可达性抽检
  - 命令：`npm run validate:contracts`（通过）
  - 命令：`npm run stack:verify`（20/20）
  - 命令：`npm run audit:deps`（通过）
  - 命令：`npm run audit:dead-code`（通过）
  - 命令：`npm run audit:security`（通过）
  - 本地预览页：`npm run web:local` 启动成功，`http://127.0.0.1:4176` 返回 200
  - 风险结论：未发现新增 P0；当前 P1 仅保留接口边界解释与日志口径说明类收口项，不新增扩展改造。

- 2026-06-12 15:32:00（本次续步）: 收口后补充验证
  - `npm run build` ✅（通过）
  - `npm run stack:verify` ✅（20/20）
  - `npm run validate:contracts` ✅
  - `npm run audit:deps` / `audit:dead-code` / `audit:security` ✅
- 最新复测记录（本次续步）: 按你要求继续执行「Phase 2 收口复核」
  - `npm run validate:contracts && npm run stack:verify`（组合）✅
  - 结果：`validate-contracts` 76/76；`stack:verify` 20/20
  - 备注：后端已由后台服务 `11257` 正常启动，`/api/v1` 20 项闭环接口全部通过
- 最新复测记录（Phase2 公开咨询闭环补充）：新增 2 项公开咨询/试听验收检查后重跑
  - 执行：`npm run validate:contracts && npm run stack:verify`
  - 结果：`validate-contracts` 76/76；`stack:verify` 22/22
  - 修复点：`public trial-booking submit` 500 原因为 `teacherId` 外键约束，已在 smoke 中移除无效 teacherId 入参；`lead create + ai reply` 仅做 `data` 字段解包修复。
  - 备注：`npm run build` ✅，阶段关闭“公开咨询与试听预约”P1闭环验证入口。
- 最新复测记录（Phase2 创始人经营对账闭环）：新增 1 项“创始人课程/缴费/课时/到课联动”核验
  - 执行：`npm run validate:contracts && npm run stack:verify`
  - 结果：`validate-contracts` 76/76；`stack:verify` 23/23
  - 核验链路：`founder/cockpit` -> `founder/courses` -> `founder/payment-records` -> `founder/lesson-accounts` -> `founder/attendance-records`
  - 风险结论：`创始人经营对账 P1` 已闭环可验，继续进入运营体验优化（课程表、导出一致性）阶段。
- 最新复测记录（平台导出链路）：新增 3 项平台导出接口验证
  - 执行：`npm run validate:contracts && npm run stack:verify`
  - 结果：`validate-contracts` 76/76；`stack:verify` 26/26
  - 核验项：`/api/v1/admin/institutions-export`、`/api/v1/admin/ai-usage-export`、`/api/v1/admin/ai-audit-export`
  - 风险结论：平台导出链路 P1 闭环完成，下一步不建议在本阶段扩大范围。
- 最新继续记录（验收质量快照）
  - 执行：`npm run audit:deps && npm run audit:dead-code && npm run audit:security && npm run build`
  - 结果：依赖对齐、无空源文件、安全基线、生产构建均通过
  - 风险结论：当前提交范围未引入新 P0/P1 风险；建议进入按钮-接口映射逐项走查，继续保持本阶段闭环不扩边。

- 2026-06-12 08:13（继续收口）：`npm run validate:contracts && npm run stack:verify`
  - 结果：`validate-contracts` 76/76；`stack:verify` 20/20
  - 说明：`stack:verify` 自动启动本地服务后执行，端到端 26/26 冒烟点位通过

- 2026-06-12 08:13（严格复核）：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false npm run stack:verify`
  - 结果：`stack:verify` 20/20（strictAuth=true, allowSkip=false）
  - tokenSources：`platform:demo-login`, `founder:demo-login`, `teacher:demo-login`, `parent:demo-login`, `student:demo-login`
  - 风险结论：严格模式无 skip，P1 漏测项未新增。

- 2026-06-12 08:13（命令口径补充）：`npm run verify:smoke`
  - 结果：19/26，返回 `http 0`（后端未启动）
  - 风险结论：该命令需搭配已启动服务使用；阶段验收统一执行 `npm run stack:verify`。

- 2026-06-12 08:16（补充改造）：`npm run verify:smoke`（后端停止环境）
  - 结果：19/26，首次报错明确提示“后端未就绪，建议先执行 npm run stack:verify”
  - 风险结论：`verify:smoke` 误报问题已降低，运维可直接根据提示分辨健康检查与鉴权验证场景。

- 2026-06-12 20:51（Phase 2 P2-1）：课程表创建/编辑抽屉上线
  - 代码：课程页新增 founder 角色课程抽屉，支持 `POST /api/v1/founder/courses` 创建与 `PATCH /api/v1/founder/courses` 更新
  - 修复：课程插入 SQL 占位符缺口已修正，避免创建时 `14 values for 15 columns` 失败
  - 校验：`npm run validate:contracts`、`npm run typecheck`、`npm run build`、本地 `bash ./scripts/smoke-check.sh http://127.0.0.1:8787` ✅
  - 页面验证：`http://127.0.0.1:8787/?role=founder` 进入课程中心后，`新建课程` 抽屉与编辑态抽屉均已通过截图核验
  - 发布：Cloudflare Pages 部署完成，预览 URL `https://3fdfbbdb.starmate-english-saas.pages.dev`
  - 线上校验：对上述 Pages URL 重新执行 smoke，`33/33` 通过

- 2026-06-12 23:25（Phase 2 个人中心成果馆收口）：`profile.open-culture-wall` 重试入口补齐
  - 代码：个人中心学习成果馆增加同步状态与失败重试按钮，失败后可直接重试打开档案中心
  - 收口：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `profile.open-culture-wall` 已改为已收口
  - 校验：本地构建与现有 smoke 口径保持通过，未新增回归

- 2026-06-12 23:41（Phase 2 学生路径闭环）：`student.path.item` / `courses.path.continue` 回读接通
  - 代码：学生首页学习路径与课程页“进入下一步”均接入 `POST /api/v1/student/review/submit`，路径完成可回写 `student_tasks`
  - 回读：`/api/v1/student/today-path` 与 `GET /api/v1/student/review/history` 均能读取同一条路径完成记录
  - 收口：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `student.path.item`、`courses.path.continue` 已改为已收口
  - 验证：`npm run validate:contracts`、`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）

- 2026-06-12 23:45（Phase 2 老师批量闭环）：`teacher.workspace.quick-close-all` 失败明细补齐
  - 代码：老师工作台批量完成课程闭环改为收集逐项结果，批量失败时在界面展示失败课程与失败原因
  - 收口：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `teacher.workspace.quick-close-all` 已改为已收口
  - 验证：`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）

- 2026-06-12 21:09（Phase 2 P2-2）：收费记录筛选与导出字段一致
  - 代码：创始人收费记录补齐学员 / 课程 / 日期范围筛选，后端 `payment_records` 关联 `students` / `courses` 返回名称字段
  - 代码：创始人经营台新增收费记录筛选区和 CSV 导出，导出字段与页面展示口径一致
  - 校验：`npm run validate:contracts`、`npm run typecheck`、`npm run build`、本地 `bash ./scripts/smoke-check.sh http://127.0.0.1:8787` ✅
  - 浏览器验证：登录 founder 后，收费记录“导出 CSV”可触发下载，文件名 `founder-payment-records-2026-06-12.csv`

- 2026-06-12 22:29（Phase 2 P2-3）：成果馆上传进度和失败恢复
  - 代码：成果馆图片 / 视频上传增加前端预检、上传中进度条、失败态重试按钮，上传成功后自动收起任务条
  - 代码：`/api/v1/admin/culture-wall` 增加图片 / 视频类型与大小校验，前后端限额统一为图片 12MB、视频 120MB
  - 代码：`requestMultipart` 改为在浏览器环境下使用 XHR 上报 `upload.onprogress`，保留 fetch 回退路径
  - 校验：`npm run lint`、`npm run typecheck`、`npm run validate:contracts`、`npm run build`、`bash ./scripts/smoke-check.sh http://127.0.0.1:8787` ✅
  - 浏览器验证：上传 20MB 测试文件时命中“图片大小不能超过 12 MB”；上传 10MB 测试文件时页面进入“上传中”并显示进度；拦截上传请求时页面进入失败态并显示“重试上传”

- 2026-06-12 22:44（Phase 2 P2-4）：个人中心同步来源提示
  - 代码：个人中心课时账户区新增“数据来源 / 最近同步 / 重新同步”提示条，父端与学生端分别标注对应课时账户接口
  - 代码：个人中心刷新函数改为向页面抛出异常，便于同步失败时展示失败态和重试入口
  - 校验：`npm run typecheck`、`npm run build`、本地 `bash ./scripts/smoke-check.sh http://127.0.0.1:8787` ✅
  - 浏览器验证：个人中心显示“数据来源”“最近同步”与“重新同步”按钮；同步条在页面中可见并随刷新更新时间戳

- 2026-06-14（Phase 2 P2-4 收口复核）：个人中心同步来源提示再校准
  - 代码：个人中心课时账户同步状态只在真实数据返回后标记为已同步；初次空态保持“待同步”，避免空对象误报成功
  - 代码：重新同步按钮在同步中显示“同步中...”并禁用，防止重复点击触发并发刷新
  - 校验：`npm run typecheck`、`npm run build` ✅
  - 浏览器验证：`http://127.0.0.1:4176` 个人中心可见“数据来源 / 最近同步 / 重新同步”，同步条显示 `学生课时账户接口` 与最新时间戳；点击重新同步后时间更新

- 2026-06-14（Phase 2 课程时间口径再统一）：课程卡时间改用统一格式化
  - 代码：老师端课程卡与个人中心课时卡不再直接透传 `time` 字段，改为统一走 `normalizeCourseTime`
  - 代码：创始人课程与收费列表中的课程状态改为统一中文枚举，`active / paused / closed` 分别显示为 `进行中 / 已暂停 / 已结课`，空态显示 `未设置`
  - 代码：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中的课程时间待确认项同步收口为“时间已统一”
  - 校验：`npm run typecheck`、`npm run build` ✅

- 2026-06-14（Phase 2 练习复盘状态收口）：练习历史与薄弱项状态统一映射
  - 代码：练习页最近复盘、错题弱项、家长/学生复盘历史统一接入 `normalizeReviewStatus`
  - 代码：`done / completed / submitted / pending / processing` 等状态码在页面侧改为 `已完成 / 进行中 / 待复习`
  - 代码：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中的 `practice.review.history` / `practice.review.mistakes` 已改为已收口
  - 校验：待补 `npm run typecheck`、`npm run build` 和浏览器回归

- 2026-06-14（Phase 2 学生课程卡状态收口）：老师端课程卡状态压成三态口径
  - 代码：老师课程卡底部状态改为由 `lessonStates` 派生，统一显示 `已完成 / 进行中 / 未开始`
  - 代码：课程卡不再直接透出原始 `lesson.status`，保留内部状态用于回写
  - 代码：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中的 `student.lesson-card.status` 已改为已收口
  - 校验：待补 `npm run typecheck`、`npm run build` 和浏览器回归

- 2026-06-14（Phase 2 试听表单引导词收口）：公开试听提示语统一成同一套表达
  - 代码：试听咨询与试听预约在缺课程、缺家长姓名、缺咨询内容时统一提示为更中性的继续式引导
  - 代码：学生页试听区与公开咨询入口都改成 `请选择试听课程后继续`
  - 代码：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中的 `student.trial.form` 已改为已收口
  - 校验：待补 `npm run typecheck`、`npm run build` 和浏览器回归

- 2026-06-14（Phase 2 公开课程规则展示优化）：公开课程卡与试听摘要补齐时间和时长层次
  - 代码：公开课程卡文案将 `时长` 改为 `课程时长`，试听摘要增加 `上课时间` 说明
  - 代码：试听详情区继续展示上课日期、到课规则、保留规则，时长与时间不再混写
  - 代码：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 的当前结论收窄为仅剩试听预约时间选择
  - 校验：待补 `npm run typecheck`、`npm run build` 和浏览器回归

- 2026-06-14（Phase 2 试听预约时间收口）：学生端试听预约补齐可选时间
  - 代码：学生端主入口新增 `试听预约时间` 的 `datetime-local` 控件
  - 代码：预约提交优先使用用户选择时间，未选择时继续默认安排明日同一时段，并补无效时间提示
  - 代码：新增 `scripts/assert-student-trial-booking-time.js`，防止后续回退成固定时间
  - 校验：`npm test` ✅（含 35/35 smoke）、`npm run typecheck` ✅、`npm run build` ✅、Chrome 桌面/移动视口回归 ✅

- 2026-06-14（Phase 2 空态/错误态区分）：公开课程与练习任务空态收口
  - 代码：学生端公开课程新增 `publicCoursesMessage`，接口失败时显示“公开课程加载失败，可点击刷新课程重试”
  - 代码：练习页新增 `practiceDataMessage`，学生数据失败且任务为空时显示“今日任务加载失败，可点击刷新任务重试”
  - 代码：新增 `scripts/assert-empty-error-states.js` 并接入 `npm test`
  - 校验：`npm test` ✅（含 35/35 smoke）、`npm run typecheck` ✅、`npm run build` ✅

- 2026-06-14（Phase 2 课时账户展示口径收口）：金额与课时数统一格式化
  - 代码：新增 `normalizeLessonHours` 与 `normalizePaidAmount`，统一课时和收费金额展示
  - 代码：个人中心课时账户、创始人课时对账不再直接透出 `paidAmount / remainingHours` 原值
  - 代码：新增 `scripts/assert-lesson-account-display.js` 并接入 `npm test`
  - 校验：`npm test` ✅（含 35/35 smoke）、`npm run typecheck` ✅、`npm run build` ✅

- 2026-06-14（Phase 2 老师课卡业务状态收口）：课卡状态从三态升级为动作口径
  - 代码：老师端新增 `getLessonBusinessStatus`，根据课堂闭环、反馈同步、练习下发状态生成业务状态
  - 代码：课卡展示 `待课前准备 / 反馈待同步 / 练习待下发 / 课堂已闭环` 等状态，选中课程汇总展示下一步动作
  - 代码：新增 `scripts/assert-teacher-lesson-business-status.js` 并接入 `npm test`
  - 校验：`npm test` ✅（含 35/35 smoke）、`npm run typecheck` ✅、`npm run build` ✅

- 2026-06-13（Phase 2 个人中心家校沟通闭环）：`profile.generate-feedback` 落库和回读
  - 代码：新增 `parent_messages` 数据表与 `GET/POST /api/v1/parent/child/:id/messages`，个人中心生成家校沟通稿后可写入家校消息记录
  - 代码：个人中心家校沟通区现在会读取最新消息并在生成后刷新回读，学生 / 家长两端都能看到最新记录
  - 清单：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `profile.generate-feedback`、`teacher.workspace.feedback`、`teacher.workspace.exercise`、`founder.leads.convert` 已改为已收口
  - 校验：`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）

- 2026-06-13（Phase 2 家长收费记录闭环）：`parent.child.payment-records` 增加追问入口
  - 代码：家长收费记录卡片增加“有疑问，联系老师/机构”按钮，不再只是静态只读列表
  - 清单：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `parent.child.payment-records` 已改为已收口
  - 校验：`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）

- 2026-06-13（Phase 2 成果馆上传闭环）：`culture-wall.prepare-upload-photo` 线上发布确认
  - 发布：Cloudflare Pages 部署完成，预览/发布地址 `https://75c609b0.starmate-english-saas.pages.dev`，别名 `https://codex-phase2-p2-1-course-dra.starmate-english-saas.pages.dev`
  - 验证：线上地址 `HTTP 200`，页面标题为 `Aggie速记英语`
  - 清单：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `culture-wall.prepare-upload-photo`、`platform.practice` 已改为已收口
  - 校验：`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）

- 2026-06-14（Phase 2 成果馆上传流收口）：图片 / 视频上传改为共用 hook
  - 代码：成果馆图片与视频上传流程抽到 `useCultureWallUpload`，进度、失败态、重试入口与上传后自动收起逻辑统一
  - 代码：`CultureWallSection` 与 `CultureWallPage` 现在共用同一套上传状态机，图片成功后更新页面内容，视频失败时保留文件并可直接重试
  - 验证：`npm run typecheck`、`npm run build`、浏览器中上传图片成功、上传视频触发 404 后出现“重试上传”按钮 ✅

- 2026-06-13（Phase 2 个人中心课程上下文闭环）：`profile.quick.courses` 携带孩子 / 课程上下文
  - 代码：个人中心“课程与课表”入口现在会把 `childId` 和 `selectedCourseId` 一起带到课程页
  - 页面：课程页顶部显示当前孩子上下文，便于后续核对课表与课程明细
  - 清单：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `profile.quick.courses` 已改为已收口
  - 校验：`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）

- 2026-06-13（Phase 2 练习页复盘闭环）：`practice.challenge.choice` / `practice.challenge.reset` 写回 `student_tasks`
  - 代码：练习页模块选择会将每轮选择写入 `student_tasks` 复盘记录，重置会将新任务写入练习记录
  - 代码：练习页恢复后，学生端可从复盘记录继续查看历史与弱项，不再只保留本地临时状态
  - 清单：`docs/unclosed-ui-controls-v4.1-internal-CN.md` 中 `practice.challenge.choice`、`practice.challenge.reset` 已改为已收口
  - 校验：`npm run typecheck`、`npm run build`、`npm run stack:verify` ✅（35/35）
