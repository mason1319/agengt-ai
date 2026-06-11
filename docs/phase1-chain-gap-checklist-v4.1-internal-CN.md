# StarMate v4.1 内部自用版 · 第一阶段六链路执行清单（可验收版）

## 目标
按当前阶段要求，逐条确保“公开招生→学生学习→老师干预→家长看板→创始人对账→登录会话”五级闭环中每个核心控件都绑定可执行 `/api/v1` 接口并回写 D1 字段。

## 6 条主链路执行清单

### 1) 公开招生咨询链路
- 入口：`/` 首页咨询区
- 控件：`public.leads.submit`
- 接口：`POST /api/v1/public/leads`
- 关键参数：`institutionId`、`guardianName`、`studentGrade`、`needSummary`、`initialMessage`、`privacyConsent`
- D1 表/字段：`leads`（`institution_id`、`guardian_name`、`student_grade`、`need_summary`、`status`）
- 写入副表：`lead_messages`（欢迎/咨询内容）
- 合规校验：未传 `institutionId`/`guardianName`/隐私同意会 `400`

### 2) 公开试听预约链路
- 入口：`/` 首页“提交试听预约”按钮
- 控件：`public.trial-bookings.submit`
- 接口：`POST /api/v1/public/trial-bookings`
- 关键参数：`leadId`、`institutionId`、`courseId`、`reservedAt`
- D1 表/字段：`trial_bookings`（`lead_id`、`institution_id`、`course_id`、`teacher_id`、`reserved_at`、`duration_minutes`、`status`）
- 成功行为：返回 `booking.id` 且后端状态 `pending`

### 3) 学生学习闭环
- 入口：学生端首页/练习
- 控件：`student.today-path`、`student.refresh`、`student.voice-practice.transcript`、`student.voice-practice.assess`、`student.review.summary`、`student.review.history`、`student.review.mistakes`
- 接口：`GET /api/v1/student/today-path`、`POST /api/v1/student/voice-practice/assess`、`GET /api/v1/student/review/summary`、`GET /api/v1/student/review/history`、`GET /api/v1/student/review/mistakes`
- D1 表/字段：
  - `student_tasks`（`student_id`、`task_type`、`status`、`score`、`transcript`）
  - `voice_practice_records`（`user_id`、`task_id`、`score`）
- 成功行为：任务列表可查，语音评分可提交并回写，summary/history/mistakes 可再次按学生拉取，课时可见

### 4) 老师点名与干预闭环
- 入口：老师端课程页 + 学生详情 + 异常区
- 控件：`teacher.course.attendance.submit`、`teacher.student.intervention.create`、`teacher.workspace.refresh`、`teacher.workspace.attendance-status`、`teacher.workspace.student-select`、`teacher.workspace.attendance-note`
- 接口：`POST /api/v1/teacher/courses/{courseId}/attendance`、`POST /api/v1/teacher/student/{studentId}/intervention`
- D1 表/字段：
  - `lessons`（`course_id`、`student_id`、`status`、`note`）
  - `attendance_records`（`course_id`、`student_id`、`attended_at`、`source_lesson_id`）
  - `teacher_interventions`（`student_id`、`intervention_type`、`action`、`note`）
- 权限：老师只能访问本机构授权学生课程记录

### 5) 家长可解释看板闭环
- 入口：家长端成长卡片与课程页
- 控件：`parent.children`、`parent.child.select`、`parent.refresh`、`parent.child.summary`、`parent.child.courses`、`parent.child.lesson-account`、`parent.child.payment-records`、`parent.child.today-tasks`
- 接口：`GET /api/v1/parent/children`、`GET /api/v1/parent/child/{id}/summary`、`.../courses`、`.../lesson-account`、`.../payment-records`、`GET /api/v1/parent/child/{id}/report-export`、`GET /api/v1/student/report-export`
- D1 表/字段：
  - `students`（`student_id`、`guardian_id`、`name`、`grade`）
  - `lesson_accounts`（`student_id`、`remaining_hours`、`used_hours`、`hold_hours`）
  - `payment_records`（`student_id`、`order_no`、`amount_cents`、`status`）
- 合规校验：`childId` 空时不发起请求（前端/后端均拦截）

### 6) 创始人经营与对账闭环
- 入口：创始人驾驶舱、课程与财务页
- 控件：`founder.cockpit`、`founder.courses.list`、`founder.payment-records`、`founder.lesson-accounts.list`、`founder.attendance-records`
- 新增筛选：`founder.filters.course-status`、`founder.filters.lead-status`、`founder.filters.payment-status`、`founder.filters.start-at`、`founder.filters.end-at`
- 接口：
  - `GET /api/v1/founder/cockpit`
  - `GET /api/v1/founder/courses`
  - `GET /api/v1/founder/payment-records`
  - `GET /api/v1/founder/lesson-accounts`
  - `GET /api/v1/founder/attendance-records`
- D1 表/字段：课程/课时/缴费/到课记录（课程总览与状态字段需一致）
- 成功行为：页面总表与明细表可复用同一会话查询，不出现“无数据但按钮可点不报错”

## 结果状态（本阶段目标）
- [x] 公开咨询提交失败原因可回显
- [x] 公开试听预约必须带 `institutionId`
- [x] 学生/家长/老师核心查询具备参数前置校验
- [x] 接口错误返回包含后端 `message/error/detail`
- [x] 创始人驾驶舱已增加筛选与刷新入口
- [x] 老师工作台已增加点名状态、学生选择、备注与刷新入口
- [x] 家长端已增加孩子切换、刷新、今日任务、课表、课时和缴费摘要
- [x] 平台机构页已增加真实刷新与新增试用机构入口
- [x] 平台 AI 审计 / AI 用量页的刷新与导出已绑定后端查询
- [x] 平台总览页的异常检查与周报导出已绑定后端查询
- [x] 家长端阶段报告导出已先刷新后导出，不再依赖纯前端定时器
- [x] 个人中心的家长版反馈已接入真实 AI Agent 调用
- [x] 首页跳转课程/课程详情/练习入口已补齐 API 控件映射
- [x] 首页公开课程刷新已接入真实课程列表接口
- [x] 首页“继续今天的任务”已接入真实 AI Agent 调用
- [x] 首页续费预警扫描已接入真实 AI Agent 调用并返回风险建议
- [x] 课程卡牌页与练习页的主按钮已接入真实 AI Agent 调用
- [x] 老师一键闭环改为先等后端结果，再批量更新前端状态
- [x] 老师端“当前课程闭环/AI反馈/AI练习/老师干预”控件已补齐接口映射
- [x] 家长端/创始人端/平台端核心交互控件已补齐映射，平台机构动作已加入映射链路
- [x] 家长端阶段报告导出已接入 `/api/v1/parent/child/{id}/report-export` 并下载回填
- [x] 学生端个人中心导出已接入 `/api/v1/student/report-export`
- [x] 首页 / 课程卡页 / 练习页 / 个人中心控件链路补充表已落库：`docs/ui-control-api-field-map-home-courses-practice-profile-v4.1-CN.md`
- [x] `courses.path.tab` 已补齐课程列表预检接口；`courses.library.item` 与 `courses.library.refresh` 已接入列表回流；文化墙上传动作已接入真实上传接口并回写状态

## 7) 创始人经营闭环验收清单（创始人页必须全部通过）

验收条件：创始人页面所有核心按钮、筛选、列表与导出均需触发真实 API，并在返回中体现一致性。

- [x] 驾驶舱总览：
  - 入口加载 `/api/v1/founder/cockpit`
  - 支持筛选 `courseStatus / leadStatus / paymentStatus / startAt / endAt`
  - 数据字段包含课程与财务关键指标

- [x] 线索管理：
  - 列表 `/api/v1/founder/leads`
  - 详情/转化 `takeover` 后可见接管痕迹（`note/actor_role/updated_at`）
  - 状态推进支持至少一次人工状态更新
  - 转正式 `/api/v1/founder/leads/{leadId}/convert` 有落库结果

- [x] 课程与收费对账：
  - 课程列表 `/api/v1/founder/courses`
  - 收费列表 `/api/v1/founder/payment-records`
  - 课时账户 `/api/v1/founder/lesson-accounts`
  - 点名明细 `/api/v1/founder/attendance-records`
  - 同一机构同一查询窗口可反查到课程-缴费-课时-到课关系（无“空按钮且无回写”）

- [x] AI 与风控看板：
  - `/api/v1/founder/ai-usage` 查询并展示 AI 请求趋势/来源
  - 风险建议从后端返回非前端硬编码文案

- [x] 平台侧巡检（第一阶段预留）：
  - 机构列表 `/api/v1/admin/institutions`
  - 机构导出 `/api/v1/admin/institutions-export`
  - AI 审计导出 `/api/v1/admin/ai-audit-export`
  - AI 用量导出 `/api/v1/admin/ai-usage-export`

验收动作（可直接执行）：

1. 登录创始人账号 → 打开驾驶舱 → 每个筛选项变更后发起请求并更新卡片/表格。
2. 打开线索页 → 选中一条线索 → 人工接管后再次打开，确认状态与操作人写入审计。
3. 进入课程页/财务页 → 分别调用课程、缴费、课时、到课接口。
4. 分别执行一次三类导出，确保导出文件字段与页面当前筛选条件一致。
5. 触发 AI 用量查询，确认返回 `institution_id / action / decision / latency_ms / user_id`。
