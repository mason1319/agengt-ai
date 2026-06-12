# Aggie速记英语 Phase 2 优先级 Backlog（v4.1 内部版）

**日期**：2026-06-12  
**基线版本**：`v4.1-phase1-closeout`  
**当前线上部署**：`https://bfb688ed.starmate-english-saas.pages.dev`  
**主域名**：`https://aggieai.me` / `https://www.aggieai.me`

## 一、阶段原则

- Phase 1 已冻结：不再把新功能回塞到第一阶段。
- Phase 2 只做可验收、可运营、可回滚的小闭环。
- 任何新控件必须同时具备：页面入口、API/数据来源、失败态、验收命令。
- 不做对外 SaaS 商业化、在线支付、App/小程序正式发行。
- 默认先修真实运营路径，再做视觉和高级报表。

## 二、可选推进方式

### 方案 A：运营闭环优先（推荐）

先补真实使用中最容易遇到的问题：老师反馈落库、练习下发、家长查看、创始人对账筛选。

优点：
- 对内部试运行最有价值。
- 每项都能通过接口、页面和 smoke 复测。
- 不扩大产品范围。

风险：
- 视觉提升较慢。
- 需要谨慎处理数据表和权限。

### 方案 B：体验优化优先

先做课程页、练习页、个人中心的视觉和文案细节。

优点：
- 观感提升快。
- 风险小，改动多集中在前端。

风险：
- 不能明显提升真实运营闭环。
- 容易继续形成“看起来能用，但数据不落地”的控件。

### 方案 C：平台能力优先

先做平台侧配置、AI provider 管理、机构套餐/阈值等能力。

优点：
- 后续多机构运营基础更好。

风险：
- 当前内部版不应过早扩到对外 SaaS。
- 可能稀释学生/老师/家长的核心闭环。

**推荐选择**：方案 A。Phase 2 Sprint 1 只做运营闭环，不做商业化扩展。

## 三、Sprint 1 建议范围（1 周）

### P0

当前无新增 P0。

### P1-1：老师反馈落库并对家长可见

来源：
- `docs/unclosed-ui-controls-v4.1-internal-CN.md`
  - `teacher.workspace.feedback`
  - `profile.generate-feedback`

目标：
- 老师端 AI 反馈生成后，不只停留在前端状态。
- 反馈能进入家长/个人中心可见记录。
- 失败时展示明确错误，不静默成功。

建议边界：
- 不做复杂 IM。
- 不做家长回复流。
- 先复用现有 `lessons.parent_feedback`，本项不新增 `communication_records`。

验收：
- 老师生成反馈后，家长视角能看到同一条记录。
- smoke 增加一项“反馈生成 -> 家长摘要读取”。
- `npm run validate:contracts && npm run stack:verify` 通过。

当前进展：
- 2026-06-12 已实现老师端 AI 反馈生成后 PATCH `/api/v1/institution/lessons` 写入 `lessons.parent_feedback`。
- 家长孩子 summary 已返回 `lessonFeedback` / `recentFeedback`，家长首页新增“最近课堂反馈”展示。
- 本地 `npm test` 已新增并通过 `teacher feedback visible to parent summary` 验收。

### P1-2：老师练习题下发到学生任务

来源：
- `teacher.workspace.exercise`
- `practice.challenge.choice`
- `practice.challenge.reset`

目标：
- 老师端 AI 生成练习题后，学生端练习/今日任务能读取到对应任务。
- 学生完成状态能至少在当前数据层可复测。

建议边界：
- 不做完整题库系统。
- 不做复杂判题引擎。
- 先支持“老师下发一组练习任务，学生端展示并完成”。

验收：
- 老师生成练习后，学生端出现任务。
- 学生提交后，复盘/错题或今日任务状态有可见变化。
- smoke 增加一项“老师练习下发 -> 学生任务读取”。

### P1-3：课时调整审计原因与扣减明细

来源：
- `founder.lesson-accounts.adjust`
- `teacher.course.attendance.submit`

目标：
- 创始人调整课时时必须填写原因。
- 老师点名/消课后展示本次扣减小时数和余额。
- 创始人可查看最近调整记录。

建议边界：
- 不做财务系统。
- 不做在线支付。
- 只做内部课时变更留痕和显示。

验收：
- 无原因调整课时被拒绝。
- 提交到课后返回扣减明细。
- 家长/创始人课时余额一致。

### P1-4：试听预约课程摘要与线索转化失败分段

来源：
- `home.select-public-course`
- `founder.leads.convert`
- `home.send-ai-reply`

目标：
- 公开课程选中后，试听表单展示课程摘要。
- 线索转化失败时能区分：学生创建、课时账户、收费记录、课程报名。

建议边界：
- 不做公开购买。
- 不做支付。
- 保持外部用户只走咨询与试听。

验收：
- 公开端选课后预约请求包含课程 ID。
- 创始人转化失败返回分段结果。
- 前端逐项显示失败/成功状态。

## 四、Sprint 2 候选

### P2-1：课程表创建/编辑抽屉

来源：`founder.courses.create`

说明：
- 适合 Sprint 1 后做。
- 需要确保课程创建后能进入公开课程、老师课程、学生课程三处读取。

### P2-2：收费记录筛选与导出字段一致

来源：`founder.payment-records`

说明：
- 先做筛选组合和字段说明。
- 不做支付。

### P2-3：成果馆上传进度和失败恢复

来源：`culture-wall.prepare-upload-photo`

说明：
- 只在上传链路稳定后做。
- 需要大小限制、类型限制、重试提示。

### P2-4：个人中心同步来源提示

来源：`profile.quick.lesson-account`

说明：
- 展示最近同步时间、数据来源、失败重试。
- 适合作为体验优化。

## 五、明确暂不做

- 在线支付/购买课程/购买课时。
- 对外 SaaS 注册与套餐售卖。
- App/小程序正式发行。
- 复杂 IM、班级群、家长回复流。
- 完整题库/判题引擎。
- 多机构代理后台。

## 六、Phase 2 Sprint 1 验收门禁

每个 P1 任务完成后必须执行：

```bash
npm run lint
npm run typecheck
npm run validate:contracts
npm run build
npm run audit:security
npm test
```

涉及线上发布时追加：

```bash
npm run cf:deploy:ensure
bash ./scripts/smoke-check.sh https://aggieai.me
bash ./scripts/smoke-check.sh https://www.aggieai.me
```

## 七、建议执行顺序

1. `P1-1 老师反馈落库并对家长可见`
2. `P1-2 老师练习题下发到学生任务`
3. `P1-3 课时调整审计原因与扣减明细`
4. `P1-4 试听预约课程摘要与线索转化失败分段`

原因：
- P1-1 和 P1-2 直接提升老师、学生、家长的真实日常使用价值。
- P1-3 保证内部运营对账可信。
- P1-4 补外部咨询到内部转化的失败态，可降低试运行误判。
