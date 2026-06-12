# StarMate v4.1 第一阶段验收签收清单（内部版）

## 验收目标
在一个浏览器会话内，完成“登录→角色链路→数据闭环→导出/异常反馈”的 5 条关键演示，确认按钮/页面不出现静态摆设空交互。

## 预备条件
- 后端可用：`npm run stack:verify` 先跑一次（或确认 Cloudflare 已在线）
- 推荐访问：本地 `http://127.0.0.1:4176` 或已部署域名
- 开启开发工具网络面板（F12 → Network）用于请求核验
- 证据：每一步至少留 1 张截图 + 1 条接口返回

---

## 1）公开咨询链路验收（外部用户）
1. 打开首页公开咨询区。
2. 点击“课程表/课程入口”，确认出现课程列表（来源：
`GET /api/v1/public/courses`）。
3. 提交咨询（名字、年级、需求），确认后端返回成功（
`POST /api/v1/public/leads`）。
4. 点击咨询后的 AI 回执/建议，确认出现文字响应（
`POST /api/v1/public/leads/{leadId}/ai-reply`）。
5. 提交试听预约，确认预约成功（
`POST /api/v1/public/trial-bookings`）。

签收标准：四步均有接口成功返回，页面无“无效按钮”。

---

## 2）学生闭环验收
1. 学生账号登录。
2. 打开首页/学习页，确认“今日任务”可见（
`GET /api/v1/student/today-path`）。
3. 打开任意任务并提交口语稿或回答（
`POST /api/v1/student/voice-practice/assess`）。
4. 回到复盘页，分别切到 summary、history、mistakes（
`GET /api/v1/student/review/{type}`）。
5. 打开课时页确认剩余课时（
`GET /api/v1/student/lesson-account`）。

签收标准：提交后有实时反馈，任务页面按接口更新状态。

---

## 3）老师闭环验收
1. 老师账号登录。
2. 打开学生列表（
`GET /api/v1/teacher/students`）。
3. 打开点名页，选择课程/学生并提交出勤状态（
`POST /api/v1/teacher/courses/{courseId}/attendance`）。
4. 对一名学生提交干预（
`POST /api/v1/teacher/student/{studentId}/intervention`）。
5. 返回教师列表确认记录更新。

签收标准：无越权访问，点名/干预请求均可回写且有反馈。

---

## 4）家长闭环验收
1. 家长账号登录。
2. 查看绑定孩子列表（
`GET /api/v1/parent/children`）。
3. 切换孩子后查看：学习摘要、课程、课时、缴费记录：
- `GET /api/v1/parent/child/{id}/summary`
- `GET /api/v1/parent/child/{id}/courses`
- `GET /api/v1/parent/child/{id}/lesson-account`
- `GET /api/v1/parent/child/{id}/payment-records`
4. 执行一次阶段报告导出（
`GET /api/v1/parent/child/{id}/report-export`）。

签收标准：仅显示绑定孩子数据；导出触发有请求响应。

---

## 5）创始人闭环验收
1. 创始人账号登录。
2. 打开驾驶舱（
`GET /api/v1/founder/cockpit`），切换课程状态/线索状态/付款状态/日期筛选。
3. 打开线索列表并执行“接管/转化”（
`/api/v1/founder/leads` 与 `.../{leadId}/takeover`、`.../{leadId}/convert`）。
4. 分别打开课程页、收费页、课时页、到课页进行一次查询：
- `GET /api/v1/founder/courses`
- `GET /api/v1/founder/payment-records`
- `GET /api/v1/founder/lesson-accounts`
- `GET /api/v1/founder/attendance-records`
5. 打开 AI 用量页（
`GET /api/v1/founder/ai-usage`）。

签收标准：筛选与导出/查询字段一致，可追溯到同一时间窗。

---

## 6）证据包清单（验收时一并上传）
- 以上 5 条链路截图（每条至少 1 张）
- 网络请求日志（含至少 1 条成功与 1 条失败/拒绝响应）
- 命令输出：
  - `npm run validate:contracts`
  - `npm run stack:verify`（优先）；
  - `npm run verify:smoke`（如后端已单独启动，作为补充复测）
  - `npm run build`
  - `npm run typecheck`
  - `npm run test`

---

## 7）验收结论模板
请在签收页末尾勾选：

- [ ] 本阶段可正常进入角色闭环
- [ ] 核心接口无空按钮/无来源
- [ ] 登录与权限边界通过
- [ ] 数据源来自 `/api/v1`（含课程/课时/咨询/收费）
- [ ] 文档与接口映射口径一致

负责人签字： __________   日期： ________
