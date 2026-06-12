# Aggie速记英语 前端组件拆分方案（TypeScript / ShadcnUI 迁移骨架）

> 目标：在不改变现有后端框架与接口前提下，把当前前端视觉层拆成可复用、可迁移、可逐步替换的组件骨架。
> 适用范围：Aggie速记英语学生端首页、课程卡牌页、练习页、个人中心。

## 1. 设计原则

- 保持现有后端 API、数据结构、登录态和路由不变。
- 前端只做视觉、排版、组件拆分和状态整理。
- 先复用现有交互，再逐步迁移到 TypeScript + ShadcnUI。
- 组件要能同时支持桌面端与移动端。
- 页面风格统一为绿白少儿英语学习板，避免后台感。

## 2. 建议技术栈映射

### React 版本

- 组件：`TypeScript + React + Vite`
- 样式：`shadcn/ui + Tailwind CSS`
- 图标：`lucide-react`
- 状态：本地 `useState` + `useMemo`
- 数据：继续调用当前 `runtimeDataService`

### Vue 版本（若后续需要迁移）

- 组件：`Vue 3 + Vite`
- 样式：`Element Plus` 或 `Naive UI`
- 图标：`@iconify/vue` 或统一图标集
- 状态：`ref` / `computed`
- 数据：保留当前接口与 DTO 结构

## 3. 设计令牌

### 颜色

- `brandGreen = #1A9B5D`
- `brandGreenSoft = #EAFBF1`
- `brandMint = #DDF7E8`
- `brandSky = #DBF3FF`
- `brandYellow = #FFF8D9`
- `brandCream = #F9FFF7`
- `textStrong = #184232`
- `textNormal = #2F5D49`
- `textMuted = #5F816F`
- `borderSoft = rgba(183, 230, 200, 0.32)`
- `shadowFloat = 0 10px 24px rgba(117, 179, 143, 0.10)`

### 圆角

- `radiusXL = 32px`
- `radiusLG = 24px`
- `radiusMD = 18px`
- `radiusSM = 14px`

### 间距

- 页面大间距：`24px`
- 卡片间距：`16px`
- 内边距：`18px - 24px`
- 标签间距：`8px - 10px`

### 字体

- 标题：圆润无衬线，推荐 `Baloo 2` / `Nunito`
- 正文：`Nunito` / `Inter` / `PingFang SC`
- 数据数字：加粗，统一用 18 - 56px 层级

## 4. 组件拆分建议

### 4.1 App Shell 层

- `AppShell`
  - 左侧导航
  - 顶部轻标题栏
  - 主内容区

- `SidebarNav`
  - 品牌名
  - 用户卡
  - 导航菜单
  - 进度条

- `TopBar`
  - 页面标题
  - 年龄段切换
  - 会话信息

### 4.2 学生首页

- `StudentHomeHero`
  - 欢迎语
  - 经验进度条
  - 四个核心数据
  - 快捷入口

- `MascotBoard`
  - 绿色吉祥物
  - 站牌文案
  - 成长标语

- `AI MentorCard`
  - 在线状态
  - 引导对话
  - 开始对话按钮
  - 4 个功能入口

- `DailyTaskMap`
  - 今日任务地图
  - 任务卡片列表
  - 任务状态

- `CourseRail`
  - 我的课程卡片
  - 课程名称、等级、进度

- `PracticeGrid`
  - 单词速记
  - 听力理解
  - 口语跟读
  - 拼写练习
  - 语法闯关
  - 综合测试

### 4.3 课程卡牌页

- `CourseBanner`
  - 学习地图标题
  - 当前阶段进度

- `CoursePathPanel`
  - 闯关路线
  - 当前关卡
  - 已完成 / 未完成状态

- `CourseDetailRail`
  - 当前课程详情
  - 上课日期
  - 到课规则
  - 课时保留
  - 课后建议

- `CourseLibraryGrid`
  - 主题课程卡
  - 课程名称、费用、时间

### 4.4 练习页

- `PracticeBanner`
  - 今天练什么
  - 当前目标

- `PracticeModuleGrid`
  - 六个功能模块
  - 当前选中状态

- `PracticeArena`
  - 单词、听力、口语、拼写、语法、测试

- `PracticeFeedbackPanel`
  - AI 结果
  - 建议
  - 分数

### 4.5 个人中心

- `ProfileSummaryCard`
  - 成长进度
  - 本周总结
  - 剩余课时

- `SkillRadarPanel`
  - 听力、口语、阅读、语法能力条

- `WeeklyStreakPanel`
  - 连续学习天数
  - 周连续性

- `ReportExportCard`
  - 阶段报告导出

- `ParentMessageCard`
  - 老师给家长的话

- `CultureWallPreview`
  - 视频、图片、老师、反馈概览

## 5. shadcn/UI 组件映射建议

| 现有视觉块 | Shadcn 组件建议 | 说明 |
|---|---|---|
| 导航菜单 | `Button`, `ScrollArea` | 菜单项做成统一按钮态 |
| 顶部标题栏 | `Card`, `Tabs` | 标题区和年龄段切换 |
| 数据卡片 | `Card` | 所有统计卡统一 |
| 进度条 | `Progress` | 经验值、学习进度 |
| 任务列表 | `Card`, `Badge`, `Button` | 可点击任务卡 |
| 对话区 | `Card`, `Textarea`, `Button` | AI 外教和反馈输入 |
| 文化墙 | `Card`, `AspectRatio` | 图片视频预览 |

## 6. TypeScript 接口建议

### 6.1 基础类型

```ts
export type Role = 'student' | 'parent' | 'teacher' | 'founder' | 'platform';
export type AgeStage = '4-6' | '7-10' | '11-13' | '14-16';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'locked';
export type CourseClassType = '小班课' | '大班课' | '一对一';
```

### 6.2 首页数据

```ts
export interface StudentHomeSummary {
  name: string;
  grade: string;
  progress: number;
  vocabCount: number;
  studyHours: number;
  checkinDays: number;
  medals: number;
  remainingHours: number;
}
```

### 6.3 任务卡

```ts
export interface DailyTaskItem {
  id: string;
  title: string;
  note: string;
  status: TaskStatus;
  score?: number;
  transcript?: string;
}
```

### 6.4 课程卡

```ts
export interface CourseCardItem {
  id: string;
  name: string;
  grade: string;
  classType: CourseClassType;
  feeLabel: string;
  timeLabel: string;
  progress: number;
}
```

## 7. 迁移顺序建议

### Phase A

- 保持当前 JS 代码不动
- 先把视觉 token 和组件边界整理清楚
- 学生首页优先拆分为独立视觉模块

### Phase B

- 新建 `src/components/` 和 `src/features/` 目录
- 把首页组件逐步迁到 `.tsx`
- 保持 API 与数据源不变

### Phase C

- 再迁课程页、练习页、个人中心
- 最后再统一成 TypeScript 组件库

## 8. 不建议做的事

- 不要改后端接口名、返回结构、数据库字段
- 不要把后台控件直接暴露到学生首页
- 不要用后台通用表格去替代少儿英语学习板
- 不要让任何页面出现 `/api/v1/...` 字符串作为可见内容
- 不要让颜色系统回到紫粉管理后台风

## 9. 结论

当前最优路径是：先在现有代码上继续收视觉，再按这个拆分骨架逐步迁出 TS 组件，不动后端、不动接口。
