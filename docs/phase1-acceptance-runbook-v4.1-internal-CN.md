# StarMate v4.1 第一阶段验收执行脚本（内部版）

## 目的
把验收过程固定成一条可执行操作链，避免遗漏接口或误判。

## 环境准备
1. 先执行：
   - `npm run stack:verify`
2. 打开浏览器访问：
   - 本地：`http://127.0.0.1:4176`
3. 开启 Network 面板，按 URL 过滤 `/api/v1/`。
4. 账号请使用本地种子管理员/测试账号（如已改造为真实账号，以实际账号为准）。

## 验收执行顺序（建议一次完成）

### A. 公开入口（不登录）
1. 刷新首页
   - 断言：课程列表组件加载
   - 接口：`GET /api/v1/public/courses`
   - 期望：返回课程卡片（课程名、班型、时间、价格字段）
2. 进入公开咨询区提交一条咨询
   - 填必填项：机构、家长/监护人、年级、咨询意向
   - 点击提交
   - 接口：`POST /api/v1/public/leads`
   - 期望：成功返回且列表可见该线索
3. 点击 AI 回复/建议
   - 接口：`POST /api/v1/public/leads/{leadId}/ai-reply`
   - 期望：返回文本建议并可见在会话区
4. 填写试听预约
   - 接口：`POST /api/v1/public/trial-bookings`
   - 期望：返回预约成功状态

### B. 学生角色（登录）
1. 登录学生
   - 接口：`POST /api/v1/auth/login`
   - 继续访问 `GET /api/v1/me`
2. 打开学生首页
   - 接口：`GET /api/v1/student/today-path`
   - 断言：有任务卡片且可点击
3. 提交任一任务（口语稿）
   - 接口：`POST /api/v1/student/voice-practice/assess`
   - 断言：返回评分/建议并在页面回填
4. 打开复盘页
   - 依次点击 summary/history/mistakes
   - 接口：`GET /api/v1/student/review/summary`, `GET /api/v1/student/review/history`, `GET /api/v1/student/review/mistakes`
   - 断言：按类型有不同列表/聚合内容
5. 打开课时信息
   - 接口：`GET /api/v1/student/lesson-account`

### C. 老师角色（登录）
1. 登录老师
2. 打开老师首页学生列表
   - `GET /api/v1/teacher/students`
3. 进入课程点名页并提交至少1条状态
   - `GET /api/v1/teacher/courses/{courseId}/attendance`
   - `POST /api/v1/teacher/courses/{courseId}/attendance`
4. 提交老师干预
   - `POST /api/v1/teacher/student/{studentId}/intervention`
   - 断言：提交成功并记录到页面

### D. 家长角色（登录）
1. 登录家长
2. 打开孩子列表
   - `GET /api/v1/parent/children`
3. 选定 1 个孩子并查看
   - `GET /api/v1/parent/child/{id}/summary`
   - `GET /api/v1/parent/child/{id}/courses`
   - `GET /api/v1/parent/child/{id}/lesson-account`
   - `GET /api/v1/parent/child/{id}/payment-records`
4. 下载阶段报告
   - `GET /api/v1/parent/child/{id}/report-export`

### E. 创始人角色（登录）
1. 登录创始人
2. 打开驾驶舱
   - `GET /api/v1/founder/cockpit`
3. 切换筛选（课程状态、线索状态、收费状态、时间区间）
   - `GET /api/v1/founder/cockpit`（含筛选参数）
4. 线索页接管+转化
   - `GET /api/v1/founder/leads`
   - `POST /api/v1/founder/leads/{leadId}/takeover`
   - `POST /api/v1/founder/leads/{leadId}/convert`
5. 对账页查询
   - `GET /api/v1/founder/courses`
   - `GET /api/v1/founder/payment-records`
   - `GET /api/v1/founder/lesson-accounts`
   - `GET /api/v1/founder/attendance-records`
6. AI 用量检查
   - `GET /api/v1/founder/ai-usage`

## 异常与替代
- 若发现某按钮无请求：标记为 P1 缺口，并回填映射文档。
- 若 `verify:smoke` 有网络失败：先确认 `npm run stack:verify` 结果（当前应为 26/26）。
- 若出现权限异常：确认角色 token 是否新鲜以及请求是否访问越权接口。

## 本次验收必须结果
- 任一链路无“无效按钮”
- 至少 5 条角色链路均可完成“读 + 写 + 回写”
- 所有截图与接口日志均留存
