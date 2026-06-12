# 星伴英语 StarMate Design v4.1

**文档类型**：产品设计 / 交互设计执行文档
**对应 PRD（执行锚点）**：`phase1-prd-starmate-english.md`
**PRD 补充**：`StarMate-PRD-v4.1-internal-CN.md`（行为策略/课程与招生细化）
**项目阶段**：Phase 1 内部 Web 可用版
**适用范围**：本机构内部学生、老师、家长、创始人；外部咨询客户仅限课程咨询、课程查看、试听预约
**暂不范围**：对外 SaaS、公开注册、在线支付、App、小程序正式版、完整文化墙
**日期**：2026-06-06

---

## 1. 设计目标

第一阶段设计只服务真实可用，不做展示型空壳页面。

总原则：**一切设计围绕解决问题，方便你、我、他。**

| 对象 | 设计要方便什么 |
|---|---|
| 创始人/机构 | 一眼看清招生、收费、学习质量、老师处理 |
| 老师/运营 | 少解释、少统计、少找人，直接处理异常和线索 |
| 学生 | 不选择、不迷路，打开就知道做什么 |
| 家长/客户 | 价格清楚、课程清楚、孩子进步清楚、预约试听清楚 |

设计验收必须问：这个页面有没有帮某个角色少一步、少想一点、少沟通一次。

| 目标 | 设计要求 |
|---|---|
| 学生能学 | 打开后直接看到今日任务，完成任务后立刻看到反馈 |
| 老师能管 | 首页只展示需要处理的异常，不让老师翻大量无关数据 |
| 家长能懂 | 用少量卡片说明孩子学了什么、哪里进步、哪里要加强 |
| 创始人能控 | 看活跃、异常、老师处理、AI 用量和内部成本 |
| 招生能接 | 客户能快速看到课程、价格、时间，并预约试听 |
| 课时能清 | 家长、老师、创始人都能一眼看清缴费、剩余课时、消课和保留课时 |

---

## 2. 设计原则

| 原则 | 说明 |
|---|---|
| 流程优先 | 每页必须有一个明确主操作 |
| 真实数据 | 页面数据必须来自 API，不允许生产环境静态 mock |
| 少控件 | 无后端行为的按钮不出现在页面 |
| 分角色 | 学生、老师、家长、创始人页面不能共用同一套展示逻辑 |
| 移动优先 | 375px 可用，无横向溢出 |
| 可审计 | 关键操作必须显示结果并写入审计 |

## 2.5 第一阶段交付执行规则（v4.1）

1. 页面只允许在 Figma 冻结后进入开发。
2. 前端 UI 组件以 `shadcn/ui + Tailwind` 组件为准；不新增散乱 `.css` 文件。
3. 本阶段不做“组件摆拍”：每个可见控件都必须可追溯到 `docs/ui-control-api-field-map.csv`。
4. 所有关键交互页必须有 `Loading / Empty / Error / Success` 四态。
5. 手机端（375px）不横向溢出；PC/H5 两端共用同一接口。

> 设计文档只定义交互，不绑定具体业务字段；字段与 D1 字段的绑定由映射表统一管理。

## 2.1 行为心理设计原则：简单、高效、上头

本系统要解决的不是“功能不够”，而是用户在学习和管理中的低耐心、低执行、怕麻烦、要反馈、怕比较、沟通内耗。设计时必须把复杂流程压成少选择、快反馈、可持续的动作循环。

### 2.1.1 用户行为映射

| 场景 | 设计策略 | 页面落地 |
|---|---|---|
| 不会表达 | 用 AI 中性话术减少沟通摩擦 | 家长摘要、老师干预备注提供可编辑草稿 |
| 基础弱 | 解释拆小，先告诉用户下一步怎么做 | 结果页只展示 1-3 个最关键错误 |
| 不想开始 | 入口低门槛，默认给出最优任务 | 学生首页主按钮固定为“开始今日任务” |
| 想马上看到结果 | 操作后立刻反馈 | 录音后显示评分中、结果、重试入口 |
| 需要奖励 | 给明确成长感 | streak、XP、完成动画、徽章预留 |
| 害怕比较 | 只展示个人进步 | 不做公开排名，不展示其他学生数据 |
| 管理内耗 | 系统自动归纳异常 | 老师只看待处理，创始人只看风险和处理进度 |

### 2.1.2 简单

| 规则 | 验收 |
|---|---|
| 每页只保留一个主按钮 | 学生端主按钮必须唯一且醒目 |
| 今日任务不超过 3 个 | 超出任务折叠到“之后再做” |
| 结果页不堆解释 | 默认只展示关键错误，详情可展开 |
| 家长端不展示原始学习日志 | 只展示摘要、进步、待加强 |

### 2.1.3 高效

| 角色 | 设计目标 |
|---|---|
| 学生 | 3 秒知道今天做什么 |
| 老师 | 3 步完成异常处理 |
| 家长 | 10 秒看懂孩子状态 |
| 创始人 | 1 屏看到活跃、异常、用量、风险 |

### 2.1.4 上头但不伤害

“上头”指持续愿意回来学习，不是沉迷式刺激。

| 允许 | 禁止 |
|---|---|
| 连续学习天数 | 赌博式随机奖励 |
| 任务完成反馈 | 公开排名刺激焦虑 |
| 错误重试进步条 | 和其他孩子比较 |
| 徽章和阶段里程碑 | 诱导未成年人过度使用 |

---

## 3. 信息架构

```text
登录页
  ├─ 公开招生咨询
  │   ├─ AI 客服咨询页
  │   ├─ 公开课程表
  │   ├─ 试听预约页
  │   └─ 咨询成功页
  ├─ 学生端
  │   ├─ 学生首页
  │   ├─ 口语练习页
  │   ├─ 复习页
  │   ├─ 学习结果页
  │   └─ 我的页面
  ├─ 老师端
  │   ├─ 老师首页
  │   ├─ 授权学生
  │   ├─ 课程点名
  │   ├─ 学生详情
  │   └─ 干预提交
  ├─ 家长端
  │   ├─ 孩子成长卡
  │   ├─ 缴费与课时
  │   ├─ 周报页
  │   └─ 申请关注
  └─ 创始人端
      ├─ 驾驶舱
      ├─ 老师处理看板
      ├─ AI 用量
      ├─ 招生线索
      ├─ 课程与收费
      ├─ 课时账户
      └─ 账号管理
```

---

## 4. 全局导航

### 4.1 登录后路由

| 角色 | 默认进入 |
|---|---|
| 学生 | `/student` |
| 老师 | `/teacher` |
| 家长 | `/parent` |
| 创始人 | `/founder` |

### 4.2 导航规则

| 规则 | 说明 |
|---|---|
| 未登录访问 | 跳转 `/login` |
| 公开咨询页 | 可未登录访问，但只能提交咨询和预约试听 |
| token 过期 | 提示会话过期，返回登录 |
| 无权限访问 | 显示无权限页，不展示数据 |
| 老师端 | 不显示家长完整手机号 |
| 家长端 | 不显示其他孩子 |

---

## 5. 登录页设计

### 5.1 页面模块

| 模块 | 内容 |
|---|---|
| 品牌区 | 星伴英语 / StarMate English |
| 登录表单 | 账号、密码 |
| 登录反馈 | 错误提示、加载状态 |
| 角色跳转 | 登录后由后端角色决定，不在前端手动切换 |

### 5.2 控件-API 映射

| 控件ID | 控件 | API | 成功状态 | 失败状态 |
|---|---|---|---|---|
| `login.account` | 账号输入 | 无提交前请求 | 输入合法 | 必填提示 |
| `login.password` | 密码输入 | 无提交前请求 | 输入合法 | 必填提示 |
| `login.submit` | 登录按钮 | `POST /api/v1/auth/login` | 跳转角色首页 | 显示错误原因 |
| `login.logout` | 退出登录 | `POST /api/v1/auth/logout` | 回到登录页 | 提示重试 |

### 5.3 状态

| 状态 | 展示 |
|---|---|
| 加载 | 登录按钮 loading |
| 错误 | 表单上方错误条 |
| 锁定 | 显示账号暂时锁定 |
| 成功 | 自动跳转 |

---

## 6. 学生端设计

### 6.1 学生首页 `/student`

核心目标：学生一打开就知道今天要做什么。

| 模块 | 内容 | API |
|---|---|---|
| 今日进度 | 今日完成数、剩余任务 | `GET /api/v1/student/today-path` |
| 今日任务 | 口语、复习、跟读任务卡 | `GET /api/v1/student/today-path` |
| 连续学习 | streak 天数 | `GET /api/v1/student/profile` |
| 下一步建议 | 系统推荐下一任务 | `GET /api/v1/student/today-path` |

主按钮：

| 控件ID | 行为 | API |
|---|---|---|
| `student.task.start` | 开始任务 | `POST /api/v1/student/tasks/:id/start` |
| `student.profile.open` | 查看我的学习 | `GET /api/v1/student/profile` |

### 6.2 口语练习页 `/student/speaking/:taskId`

核心目标：完成一次录音、提交、反馈、重试。

| 模块 | 内容 | API |
|---|---|---|
| 任务句子 | 本次练习文本 | `GET /api/v1/student/today-path` |
| 录音区 | 开始录音、停止录音、播放 | 浏览器录音能力 |
| 提交评分 | 上传音频并评分 | `POST /api/v1/student/voice-practice/assess` |
| 反馈区 | 得分、错误词、建议 | `POST /api/v1/student/voice-practice/assess` |
| 重试 | 对低分词再次录音 | `POST /api/v1/student/voice-practice/assess` |

状态：

| 状态 | 展示 |
|---|---|
| 待开始 | 显示句子和录音按钮 |
| 录音中 | 计时器和停止按钮 |
| 上传中 | 进度和不可重复点击 |
| 评分中 | loading |
| 已完成 | 分数、错误点、下一步 |
| 失败 | 保存本地提示，支持重试 |

### 6.3 复习页 `/student/review`

| 模块 | 内容 | API |
|---|---|---|
| 复习队列 | 今日要复习的单词/错题 | `GET /api/v1/student/review/queue` |
| 答题区 | 选择/输入/听音辨义 | 无提交前请求 |
| 提交结果 | 记录对错和熟练度 | `POST /api/v1/student/review/submit` |
| 下一题 | 拉取下一项 | `GET /api/v1/student/review/queue` |

### 6.4 学习结果页 `/student/result/:eventId`

| 模块 | 内容 | API |
|---|---|---|
| 结果摘要 | 本次得分、完成情况 | `GET /api/v1/student/learning-events` |
| 错误点 | 错词、薄弱点 | `GET /api/v1/student/learning-events` |
| 下一步建议 | 下一任务 | `GET /api/v1/student/today-path` |

---

## 7. 老师端设计

### 7.1 老师首页 `/teacher`

核心目标：老师只看需要处理的学生。

| 模块 | 内容 | API |
|---|---|---|
| 今日异常 | 低活跃、低分、家长申请 | `GET /api/v1/teacher/exceptions` |
| 授权学生 | 老师可见学生列表 | `GET /api/v1/teacher/students` |
| 处理进度 | 已处理/未处理 | `GET /api/v1/teacher/exceptions` |

### 7.2 学生详情 `/teacher/student/:studentId`

| 模块 | 内容 | API |
|---|---|---|
| 学生摘要 | 姓名、年级、最近状态 | `GET /api/v1/teacher/student/:studentId/detail` |
| 学习趋势 | 最近 7 天任务完成 | `GET /api/v1/teacher/student/:studentId/detail` |
| 薄弱点 | Top 3 问题 | `GET /api/v1/teacher/student/:studentId/detail` |
| 历史干预 | 老师处理记录 | `GET /api/v1/teacher/student/:studentId/detail` |

### 7.3 干预提交

| 控件ID | 行为 | API |
|---|---|---|
| `teacher.intervention.type` | 选择干预类型 | 无提交前请求 |
| `teacher.intervention.note` | 填写备注 | 无提交前请求 |
| `teacher.intervention.submit` | 提交干预 | `POST /api/v1/teacher/student/:studentId/intervention` |

干预类型：

| 类型 | 说明 |
|---|---|
| 强化任务 | 给学生增加一个练习 |
| 人工辅导 | 线下/线上老师处理 |
| 家长沟通 | 需要联系家长 |
| 误判驳回 | 系统异常标记不成立 |

---

## 8. 家长端设计

### 8.1 成长摘要 `/parent`

核心目标：家长 10 秒内看懂孩子有没有进步。

| 模块 | 内容 | API |
|---|---|---|
| 孩子切换 | 我的孩子列表 | `GET /api/v1/parent/children` |
| 本周学了什么 | 任务摘要 | `GET /api/v1/parent/child/:studentId/summary` |
| 哪里进步 | 进步维度 | `GET /api/v1/parent/child/:studentId/summary` |
| 哪里要加强 | 最多 3 个问题 | `GET /api/v1/parent/child/:studentId/summary` |
| 接下来建议 | 下周建议 | `GET /api/v1/parent/child/:studentId/summary` |

### 8.2 周报 `/parent/report/:studentId`

| 模块 | 内容 | API |
|---|---|---|
| 学习时长 | 周学习分钟 | `GET /api/v1/parent/child/:studentId/report` |
| 完成情况 | 任务完成率 | `GET /api/v1/parent/child/:studentId/report` |
| 能力变化 | 口语/词汇/复习 | `GET /api/v1/parent/child/:studentId/report` |
| 老师建议 | 老师干预摘要 | `GET /api/v1/parent/child/:studentId/report` |

### 8.3 申请老师关注

| 控件ID | 行为 | API |
|---|---|---|
| `parent.attention.reason` | 输入问题 | 无提交前请求 |
| `parent.attention.submit` | 提交申请 | `POST /api/v1/parent/child/:studentId/request-attention` |

---

## 9. 创始人端设计

### 9.1 驾驶舱 `/founder`

核心目标：创始人看经营质量，不亲自盯每个学生。

| 模块 | 内容 | API |
|---|---|---|
| 今日学习概况 | 活跃学生、任务完成率 | `GET /api/v1/founder/cockpit` |
| 风险提醒 | 低活跃、低分、未处理 | `GET /api/v1/founder/cockpit` |
| 老师处理 | SLA、未处理异常 | `GET /api/v1/founder/teacher-sla` |
| AI 用量 | 请求数、语音分钟、成本估算 | `GET /api/v1/founder/ai-usage` |

### 9.2 账号管理 `/founder/users`

| 控件ID | 行为 | API |
|---|---|---|
| `founder.user.create` | 创建学生/老师/家长 | `POST /api/v1/founder/users` |
| `founder.user.disable` | 停用账号 | `PATCH /api/v1/founder/users/:id/status` |
| `founder.user.enable` | 启用账号 | `PATCH /api/v1/founder/users/:id/status` |

### 9.3 招生线索 `/founder/leads`

核心目标：AI 客服先接待，创始人/运营看线索质量和转化状态。

| 模块 | 内容 | API |
|---|---|---|
| 线索列表 | 新咨询、已联系、已预约、已试听、已转化 | `GET /api/v1/founder/leads` |
| 线索详情 | 家长信息、孩子情况、AI 对话摘要 | `GET /api/v1/founder/leads/:id` |
| 跟进记录 | 人工备注和下一步 | `POST /api/v1/founder/leads/:id/follow-ups` |
| 状态更新 | 更新线索阶段 | `PATCH /api/v1/founder/leads/:id/status` |
| 人工接管 | 运营/创始人接管 AI 客服 | `POST /api/v1/founder/leads/:id/takeover` |
| 转正式学生 | 创建学生与家长账号 | `POST /api/v1/founder/leads/:id/convert` |

---

## 9.4 公开招生咨询设计

### 9.4.1 AI 客服咨询页 `/consult`

核心目标：外部家长/个人不用登录，也能被 AI 客服接待，快速留下有效线索。

| 模块 | 内容 | API |
|---|---|---|
| AI 欢迎语 | 说明可咨询课程和试听 | `POST /api/v1/public/leads/:id/ai-reply` |
| 基础信息收集 | 孩子年龄、年级、英语问题、联系方式 | `POST /api/v1/public/leads` |
| AI 初步建议 | 推荐学习方向和试听类型 | `POST /api/v1/public/leads/:id/ai-reply` |
| 试听预约入口 | 推荐可选时间 | `POST /api/v1/public/trial-bookings` |
| 隐私确认 | 勾选同意联系和隐私政策 | `POST /api/v1/public/leads` |

### 9.4.0 公开课程表 `/courses`

参考课程表图片，公开端不使用 Excel 式大表格，改成“课程卡片 + 筛选”。家长/客户最关心：时间、适合年级、课程解决什么问题、价格、剩余名额、试听入口。

| 模块 | 内容 | API |
|---|---|---|
| 月份/期开课信息 | 例如 2026 年 8 月暑假课，预计开课/结课时间 | `GET /api/v1/public/courses` |
| 年级筛选 | 一二年级、三四年级、小升初等 | `GET /api/v1/public/courses` |
| 时间段筛选 | 上午、下午、晚上 | `GET /api/v1/public/courses` |
| 课程卡片 | 课程名、班型、上课时间、适合年级、课次、价格、连报价、剩余名额 | `GET /api/v1/public/courses` |
| 试听按钮 | 选择该课程进入试听预约 | `POST /api/v1/public/trial-bookings` |
| AI 推荐 | AI 根据孩子情况推荐课程 | `POST /api/v1/public/leads/:id/ai-reply` |

课程卡片字段：

| 字段 | 是否公开 |
|---|---|
| 课程名称 | 是 |
| 班型：小班课/大班课/一对一 | 是 |
| 上课时间段 | 是 |
| 开课/结课时间 | 是 |
| 课程介绍 | 是 |
| 适合年级 | 是 |
| 每期/次 | 是 |
| 课程单价 | 是 |
| 两期连报价格 | 是 |
| 限招人数 | 是 |
| 剩余名额 | 是 |
| 已报名学生名单 | 否 |
| 某学生缴费状态 | 否 |
| 实收金额/欠费 | 否 |

课程筛选项：

| 筛选 | 示例 |
|---|---|
| 年级 | 一二年级、三四年级、小升初 |
| 班型 | 小班课、大班课、一对一 |
| 时间 | 上午、下午、晚上 |
| 课程类型 | 音标、自然拼读、课内同步、新概念 |
| 价格 | 低到高、高到低 |

AI 客服文案规则：

| 允许 | 禁止 |
|---|---|
| 询问孩子年级、基础、学习目标 | 问无关隐私 |
| 推荐试听方向 | 承诺提分或保证效果 |
| 说明机构老师会跟进 | 直接替老师做最终诊断 |
| 提醒家长确认授权 | 绕过隐私确认 |

### 9.4.2 试听预约页 `/consult/trial`

| 控件ID | 行为 | API |
|---|---|---|
| `consult.trial.time` | 选择试听时间 | 无提交前请求 |
| `consult.trial.course` | 选择试听方向 | 无提交前请求 |
| `consult.trial.submit` | 提交试听预约 | `POST /api/v1/public/trial-bookings` |

### 9.4.3 咨询成功页 `/consult/success`

| 模块 | 内容 |
|---|---|
| 提交结果 | 告知已收到咨询 |
| 下一步 | 提示 AI 客服/老师会继续跟进 |
| 联系说明 | 不展示内部学生数据 |

### 9.5 课程与收费 `/founder/courses`

内部创始人/运营使用。这里可以用表格，因为要做筛选、核对和收费记录。

| 模块 | 内容 | API |
|---|---|---|
| 课程表 | 课程、班型、时间、年级、价格、名额、报名人数 | `GET /api/v1/founder/courses` |
| 课程编辑 | 新增/修改课程 | `POST /api/v1/founder/courses` / `PATCH /api/v1/founder/courses/:id` |
| 报名管理 | 把线索或学生加入课程 | `POST /api/v1/founder/courses/:id/enrollments` |
| 收费记录 | 已收、未收、实收金额、收费时间、备注 | `POST /api/v1/founder/payment-records` |
| 对账筛选 | 按课程、学生、状态、时间筛选 | `GET /api/v1/founder/courses` |

### 9.6 家长课程展示

放在家长成长卡下方，不占首屏主位。

| 模块 | 内容 | API |
|---|---|---|
| 孩子课程 | 已报课程、上课时间、开课/结课 | `GET /api/v1/parent/child/:studentId/courses` |
| 缴费状态 | 已缴/待确认/未缴 | `GET /api/v1/parent/child/:studentId/courses` |
| 剩余课次 | 已上/剩余 | `GET /api/v1/parent/child/:studentId/courses` |

### 9.7 家长缴费与课时 `/parent/lesson-account/:studentId`

核心目标：家长一眼看懂“交了多少钱、买了多少课、上了多少、还剩多少、为什么扣课或保留”。

| 模块 | 内容 | API |
|---|---|---|
| 缴费摘要 | 已缴金额、缴费状态、课程名称 | `GET /api/v1/parent/child/:studentId/lesson-account` |
| 课时摘要 | 总课时、已上、剩余、保留 | `GET /api/v1/parent/child/:studentId/lesson-account` |
| 上课记录 | 日期、课程、老师、到课/请假/缺课、是否消课 | `GET /api/v1/parent/child/:studentId/lesson-account` |
| 保留原因 | 请假、停课、补课等 | `GET /api/v1/parent/child/:studentId/lesson-account` |

家长端不显示其他学生信息，不显示内部备注。

### 9.8 老师课程点名 `/teacher/courses/:courseId/attendance`

核心目标：老师上课时快速点名，系统自动形成消课或保留记录。

| 控件ID | 行为 | API |
|---|---|---|
| `attendance.present` | 标记到课 | `POST /api/v1/teacher/courses/:courseId/attendance` |
| `attendance.leave` | 标记请假，不消课 | `POST /api/v1/teacher/courses/:courseId/attendance` |
| `attendance.absent` | 标记缺课，按规则处理 | `POST /api/v1/teacher/courses/:courseId/attendance` |
| `attendance.late` | 标记迟到 | `POST /api/v1/teacher/courses/:courseId/attendance` |
| `attendance.note` | 填写备注 | `POST /api/v1/teacher/courses/:courseId/attendance` |

### 9.9 创始人课时账户 `/founder/lesson-accounts`

| 模块 | 内容 | API |
|---|---|---|
| 课时总览 | 学生、课程、总课时、剩余、保留 | `GET /api/v1/founder/lesson-accounts` |
| 消课明细 | 每次到课、请假、缺课、扣课原因 | `GET /api/v1/founder/attendance-records` |
| 手动调整 | 调整课时并填写原因 | `PATCH /api/v1/founder/lesson-accounts/:id/adjust` |
| 对账筛选 | 按学生、课程、老师、日期筛选 | `GET /api/v1/founder/lesson-accounts` |

---

## 10. 全局状态设计

| 状态 | 设计规则 |
|---|---|
| Loading | 骨架屏或按钮 loading，不允许白屏 |
| Empty | 告诉用户当前没有任务/异常/报告 |
| Error | 显示原因和重试入口 |
| Success | 明确告诉用户操作完成 |
| Unauthorized | 回登录页或无权限页 |
| Offline | 提示网络异常，允许本地暂存录音 |

---

## 11. 移动端设计

### 11.1 断点

| 宽度 | 设计 |
|---|---|
| 375px | 手机主验收尺寸 |
| 768px | 平板/小屏 |
| 1024px+ | 桌面后台 |

### 11.2 移动端规则

| 规则 | 说明 |
|---|---|
| 单列优先 | 学生/家长端手机单列 |
| 底部主操作 | 学生任务按钮靠近底部 |
| 表格转卡片 | 老师/创始人移动端不显示宽表 |
| 不横向滚动 | 任意页面 375px 不出现横向滚动 |
| 触控尺寸 | 主要按钮高度不低于 44px |

---

## 12. shadcn/ui 组件映射

| 用途 | 组件 |
|---|---|
| 按钮 | `Button` |
| 输入 | `Input`、`Textarea` |
| 表单 | `Form` |
| 弹窗 | `Dialog` |
| 下拉 | `Select` |
| 标签 | `Badge` |
| 卡片 | `Card` |
| 表格 | `Table` |
| Tabs | `Tabs` |
| 提示 | `Alert`、`Toast` |
| 加载 | `Skeleton` |
| 菜单 | `DropdownMenu` |

样式约束：

| 规则 | 说明 |
|---|---|
| 全局样式 | 只允许一个 Tailwind/shadcn 全局入口 |
| 页面样式 | 不新建业务 `.css` 文件 |
| 主题 | 用 CSS variables / Tailwind token |
| 图标 | 优先 lucide-react |

---

## 13. Figma 交付清单

| 文件/页面 | 内容 |
|---|---|
| `00 Cover` | 项目信息 |
| `01 Flow` | 角色流程图 |
| `02 Login` | 登录页 |
| `03 Student` | 学生首页、口语、复习、结果页 |
| `04 Teacher` | 老师首页、今日课程、点名消课、学生详情、干预 |
| `05 Parent` | 成长摘要、周报、缴费记录、剩余课时、孩子课程表 |
| `06 Founder` | 驾驶舱、账号管理、课程发布、收费记录、课时账户、AI 用量 |
| `07 Consult` | AI 客服咨询、公开课程表、课程详情、试听预约、咨询成功 |
| `08 Components` | 组件状态 |
| `09 Mobile` | 375px 关键页面 |

---

## 14. 控件验收规则

每个控件必须出现在控件映射表中：

```text
页面 | 控件ID | 控件类型 | 触发事件 | API | 方法 | 请求字段 | 响应字段 | 权限 | 失败状态
```

不能通过验收的情况：

| 情况 | 结果 |
|---|---|
| 按钮没有 API 或路由 | 删除或补接口 |
| 表格数据写死 | 不通过 |
| 弹窗只展示不提交 | 不通过 |
| AI 客服只前端假回复 | 不通过 |
| 咨询线索不落库 | 不通过 |
| 课程卡片没有价格、年级、时间、班型、剩余名额 | 不通过 |
| 家长缴费和课时数据写死或不可查 | 不通过 |
| 老师点名只改前端状态不更新课时 | 不通过 |
| 老师看到未授权学生 | 不通过 |
| 家长看到其他孩子 | 不通过 |
| 录音不上传 R2 | 不通过 |

---

## 15. 第一阶段设计验收

| 项 | 标准 |
|---|---|
| 页面完整 | 公开咨询、公开课程表、登录、学生、老师、家长、创始人核心页面齐全 |
| 角色隔离 | 不同角色看到不同首页 |
| 控件映射 | 所有按钮有 API 或明确路由 |
| 状态完整 | Loading/Empty/Error/Success |
| 移动端 | 375px 无横向溢出 |
| 后端一致 | 页面字段能映射到 D1 或 API 响应 |
| 经营闭环 | 课程、收费、课时、点名、试听跟进有完整状态 |
| 招生咨询边界 | 可提交咨询和预约试听，不出现套餐购买、支付、自助开正式账号 |

---

## 16. 下一步

设计文档确认后，下一步输出：

1. `OpenAPI v4.1` 接口合约
2. `D1 schema v4.1` 表结构草案
3. `页面控件-API-字段映射表`
4. `Phase 1A 开发任务清单`
