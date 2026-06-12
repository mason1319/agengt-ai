# StarMate v4.1 内部自用版
## 首页 / 课程卡页 / 练习页 / 个人中心
## 页面控件-接口-字段增补映射（2026-06-11）

> 目标：把“当前页面可见控件”与 `/api/v1` 逐一绑定；无后端来源的控件列为“本阶段待修订”。

### 1) 首页（`home`）

| 页面控件ID | 展示位置 | 交互行为 | 已绑定接口 | 关键字段（D1） | 当前风险 |
|---|---|---|---|---|---|
| `home.quick-start` | 英雄区主按钮“继续今天的任务” | 一键生成今日学习建议 | `POST /api/v1/ai/agent` | `ai_audit_logs`,`ai_usage`（`action`,`payload`,`request_id`） | 可继续保持 `ai/agent`，不触发实质数据库落表时会计入“建议”类型 |
| `home.jump-courses` | 英雄区/顶部入口“课程/查看课程” | 打开课程中心 | `GET /api/v1/student/courses`（学生端）/`GET /api/v1/founder/courses`（创始人端） | `student_courses`,`courses`,`course_enrollments` | 已绑定：进入课程页前触发统一刷新回调 |
| `home.enter-practice` | 首页练习入口（模块卡片） | 切换至练习页 | `POST /api/v1/ai/agent`（进入即生成任务建议） | `ai_audit_logs`（`action`,`payload`,`request_id`） | 可保留，建议同时触发 `GET /api/v1/student/today-path` 做列表校验 |
| `home.jump-practice` | 首页“学习练习”入口 | 进入学习练习页 | `GET /api/v1/student/today-path`（学生端）/`GET /api/v1/founder/courses`（创始人端） | `student_tasks`（`task_id`,`student_id`,`task_type`,`status`,`score`） | 已绑定 |
| `home.open-culture-wall` | 学习档案卡片 | 打开学习档案与文化墙 | `GET /api/v1/admin/culture-wall`（创始人/老师）/`GET /api/v1/public/courses`（公开位） | `culture_wall_assets`（`institution_id`;`kind`;`title`;`status`;`media_key`;`media_url`） | 已补齐：打开前已与主页列表保持对齐 |
| `public.courses.refresh` | 公开招生区“刷新课程” | 刷新公开课列表 | `GET /api/v1/public/courses` | `courses`（`id`,`name`,`grade`,`class_type`,`start_time`...） | 已对齐 |
| `home.select-public-course` | 公开课程卡片“立即预约试听” | 选中课程，不提交 | `GET /api/v1/public/courses`（列表回填） | `courses` | 纯选择态，非后端写动作，允许保持仅客户端状态 |
| `home.submit-consult` | 公开咨询“提交咨询” | 生成/提交咨询线索 | `POST /api/v1/public/leads` | `leads`（`institution_id`,`guardian_name`,`student_grade`,`need_summary`,`initial_message`） | 已对齐 |
| `home.submit-trial` | 公开咨询“提交试听预约” | 提交试听预约 | `POST /api/v1/public/trial-bookings` | `trial_bookings`（`lead_id`,`institution_id`,`course_id`,`reserved_at`,`duration_minutes`,`status`） | 已对齐 |
| `home.send-ai-reply` | 公开咨询“发送 AI 回执” | AI 回复一条线索 | `POST /api/v1/public/leads/{leadId}/ai-reply` | `lead_messages`（`lead_id`,`actor_role`,`message`,`created_at`） | 需保证 `leadId` 必填且可读回执 |
| `home.risk-scan` | 运营提醒“立即扫描” | 触发续费风险建议 | `POST /api/v1/ai/agent` | `ai_audit_logs`（`action`,`payload`,`request_id`） | 可继续保持 |
| `home.quick-card.courses` | 右侧“在读课程”卡片 | 跳课程中心 | `GET /api/v1/student/courses`（学生端）/`GET /api/v1/founder/courses`（创始人端） | `courses`,`course_enrollments` | 已补齐：点击前执行刷新接口回调 |
| `home.quick-card.practice` | 右侧“学习练习”卡片 | 跳练习页 | `GET /api/v1/student/today-path` | `student_tasks`（`student_id`,`task_type`,`status`,`created_at`） | 已补齐：点击前执行刷新接口回调 |

### 2) 课程卡页（`courses`）

| 页面控件ID | 展示位置 | 交互行为 | 已绑定接口 | 关键字段（D1） | 当前风险 |
|---|---|---|---|---|---|
| `courses.overview.refresh` | 课程页“刷新总览” | 刷新课程总览卡片 | `GET /api/v1/student/courses`（学生端）/`GET /api/v1/founder/courses`（创始人端） | `courses`,`course_enrollments`,`lesson_accounts` | 已闭环：点击即触发 onRefreshCourses 回流 |
| `courses.path.select` | 学习路径按钮 | 选择课程路径 | `POST /api/v1/ai/agent` | `ai_audit_logs` | 可继续保持 |
| `courses.path.continue` | 当前路径“继续学习” | 完成路径步骤并解锁下一步建议 | `POST /api/v1/ai/agent` | `ai_audit_logs` | 结果建议写入前端状态，建议同步 `student_tasks` 进度 |
| `courses.path.tab` | 课程详情页签 | 切换课程详情视图 | `GET /api/v1/student/courses`（切换前上下文预检） | `courses`,`course_enrollments`（`course_id`;`name`;`status`） | 已补齐：切换前触发课程列表回流 |
| `courses.library.refresh` | 课程清单区“查看全部” | 聚焦完整列表 | `GET /api/v1/student/courses` | `courses` | 建议后续补上与当前角色课程列表联动的参数化请求 |
| `courses.library.item` | 课程卡片 | 切换当前课程 | `GET /api/v1/student/courses`（切换后可选同一会话二次查询） | `courses`,`course_enrollments` | 已补齐：点击前触发课程列表回流 |

### 3) 练习页（`practice`）

| 页面控件ID | 展示位置 | 交互行为 | 已绑定接口 | 关键字段（D1） | 当前风险 |
|---|---|---|---|---|---|
| `student.review.summary` | 今日任务/复盘 | 拉取汇总 | `GET /api/v1/student/review/summary` | `student_tasks`（`student_id`,`task_type`,`status`,`score`） | 建议与 `student.review` 一并联动 |
| `student.review.history` | 复盘列表 | 拉取最近练习 | `GET /api/v1/student/review/history` | `student_tasks`（`task_id`,`answer`,`score`,`status`,`updated_at`） | 已对齐 |
| `student.review.mistakes` | 弱项列表 | 拉取错题/薄弱点 | `GET /api/v1/student/review/mistakes` | `student_tasks`（`task_type`,`answer`,`score`,`status`） | 已对齐 |
| `practice.challenge.start` | 练习按钮“开始练习” | 生成练习内容 | `POST /api/v1/ai/agent` | `ai_audit_logs` | 允许 |
| `practice.challenge.choice` | 练习项按钮 | 提交行为并反馈 | `POST /api/v1/ai/agent` | `ai_audit_logs` | 允许 |
| `practice.challenge.reset` | “重置内容” | 重置练习并返回新任务 | `POST /api/v1/ai/agent`（当前实现） | `ai_audit_logs` | 允许；如需真实题库请接 `POST /api/v1/student/review/submit` |
| `practice.task.item` | 今日任务打卡项 | 标记完成/状态 | `POST /api/v1/student/voice-practice/assess` | `voice_practice_records`（`task_id`,`transcript`,`score`,`result`） | 已闭环：学生提交后回填评分与建议 |
| `practice.transcript` | 任务输入框 | 输入语音稿 | `POST /api/v1/student/voice-practice/assess`（提交前校验） | `voice_practice_records`（`transcript`） | 保留本地暂存，提交时统一校验 |

### 4) 个人中心（`profile`）

| 页面控件ID | 展示位置 | 交互行为 | 已绑定接口 | 关键字段（D1） | 当前风险 |
|---|---|---|---|---|---|
| `profile.quick.lesson-account` | 课时账户卡片 | 查看课时概览 | `GET /api/v1/student/lesson-account` | `lesson_accounts`（`remaining_hours`,`used_hours`,`hold_hours`,`payment_status`） | 建议与 `GET /api/v1/parent/child/{id}/lesson-account` 做一致性对账 |
| `profile.course-clear` | “查看全部在读课程” | 跳课程页 | `GET /api/v1/student/courses` | `courses`,`course_enrollments` | 当前仅导航，建议补课程列表预取 |
| `profile.quick.practice` | 快捷动作“学习练习” | 跳练习页 | `GET /api/v1/student/today-path` | `student_tasks` | 建议在跳转前读取一次当天路径 |
| `profile.open-culture-wall` | 快捷动作“查看学习档案” | 跳文化墙 | `GET /api/v1/admin/culture-wall`（创始人/老师） / `GET /api/v1/public/courses`（公开位） | `culture_wall_assets` | 已补齐：先刷新后跳转 |
| `profile.export-report` | 报告页“导出阶段报告” | 导出阶段报告 | `GET /api/v1/student/report-export` | `student_tasks`,`lesson_accounts`,`payment_records`,`courses` | 已对齐 |
| `profile.generate-feedback` | 家校反馈模块 | 一键生成反馈草稿 | `POST /api/v1/ai/agent` | `ai_audit_logs` | 建议落库 `parent_messages` 便于留痕（当前未建表回写） |

### 5) 文化墙（`culture-wall`）

| 页面控件ID | 展示位置 | 交互行为 | 已绑定接口 | 关键字段（D1） | 当前风险 |
|---|---|---|---|---|---|
| `culture-wall.view-home-sync` | 文化墙顶部操作区 | 查看首页同步展示 | `GET /api/v1/admin/culture-wall`（创始人/老师）/`GET /api/v1/public/courses`（公开位） | `culture_wall_assets`（`institution_id`;`kind`;`title`;`status`;`media_url`） | 当前与首页同步内容同源 |
| `culture-wall.prepare-upload-photo` | 上传动作 | 准备上传图片素材 | `POST /api/v1/admin/culture-wall` | `culture_wall_assets`（`institution_id`;`kind`;`title`;`media_key`;`media_url`） | 当前为上传入口，需要接上传中台兜底失败提示 |
| `culture-wall.prepare-upload-video` | 上传动作 | 准备上传教学视频 | `POST /api/v1/admin/culture-wall` | `culture_wall_assets`（`institution_id`;`kind`;`title`;`media_key`;`media_url`） | 当前为上传入口，需要接上传中台兜底失败提示 |
| `culture-wall.view-all` | 概览区 | 查看全部内容 | `GET /api/v1/admin/culture-wall` | `culture_wall_assets`（`institution_id`;`kind`;`title`;`status`;`media_key`;`media_url`） | 建议补分页参数与搜索过滤 |

### 6) 本次扫描结论（首页/课程/练习/个人中心）

- 已有 CSV 现有条目覆盖：`home.quick-start`、`home.jump-courses`、`home.jump-practice`、`home.enter-practice`、`home.quick-card.courses`、`home.quick-card.practice`、`home.open-culture-wall`、`home.risk-scan`、`home.submit-consult`、`home.submit-trial`、`home.send-ai-reply`、`student.review.*`、`student.lesson-account`、`student.report-export`、`profile.quick.lesson-account`、`profile.course-clear`、`profile.quick.practice`、`profile.open-culture-wall`、`profile.export-report`、`profile.generate-feedback`、`culture-wall.view-home-sync`、`culture-wall.prepare-upload-photo`、`culture-wall.prepare-upload-video`、`culture-wall.view-all`、`courses.overview.refresh`、`courses.path.select`、`courses.path.continue`、`courses.library.refresh`、`courses.library.item`、`practice.challenge.start`、`practice.challenge.choice`、`practice.challenge.reset`、`practice.task.item`、`practice.transcript`。
- 仍需修订：
  1. `courses.path.tab` 已加切换前课程列表预检接口；
  2. `courses.library.item` 已补课程卡片切换前刷新；
  3. `courses.library.refresh` 已按“查看/刷新”统一触发课程列表回填；
  4. 文化墙上传入口已接入 `onUploadAsset` 回写日志链；
  5. `practice.challenge.start/choice/reset` 建议接 `POST /api/v1/student/review/submit`，形成题库化闭环。

### 7) 建议执行顺序（下一个“继续”）

1. 先修复 5 点“仍需修订”中的 API 绑定缺口。
2. 将上述 `control_id` 与 `docs/ui-control-api-field-map.csv` 去重对齐，并自动与 `openapi-v4.1.yaml` 做字段一致性检查。
3. 重新执行一次 `Phase1` 结果状态复核并给出可验收清单（含按钮级别通过/未通过）。
