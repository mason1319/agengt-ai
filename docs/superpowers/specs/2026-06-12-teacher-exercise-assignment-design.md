# Phase 2 P1-2 老师练习下发到学生任务设计

## 背景

Phase 2 P1-2 要解决 `teacher.workspace.exercise` 当前只生成前端草稿的问题。老师点击“AI生成练习题”后，学生端应能在今日任务或学习练习入口读取到同一组练习任务。

## 目标

- 老师端 AI 生成练习题后，能落库到现有 `student_tasks`。
- 学生端 `/api/v1/student/today-path` 能读取到老师下发的练习任务。
- smoke 增加一项“老师练习下发 -> 学生任务读取”。
- 不扩展完整题库系统，不新增复杂判题引擎。

## 推荐方案

新增专用 API：

`POST /api/v1/teacher/student/{studentId}/exercise`

该 API 复用现有 `student_tasks` 表，不新增表。它只负责把老师已生成的练习结果保存为学生任务。

## 数据写入

写入 `student_tasks`：

- `task_type`: `exercise`
- `title`: AI 输出标题，缺省为 `课后练习`
- `answer`: 空字符串
- `score`: `0`
- `status`: `pending`
- `payload`: JSON，包含：
  - `tasks`: 题目数组
  - `source`: `teacher_exercise`
  - `lessonId`
  - `topic`
  - `difficulty`
  - `generatedAt`

## 后端权限

- 允许角色：`teacher`、`founder`、`platform`
- 老师角色只能给自己负责的学生下发练习。
- `studentId` 必填。
- 至少需要 `title` 或一条 `tasks`。

## 前端流程

老师端 `runAgentExercise`：

1. 调用 `/api/v1/ai/agent`，action 为 `exercise_generate`。
2. 规范化 AI 输出为 `{ title, tasks }`。
3. 调用新增练习下发 API，传入当前课程学生、lessonId、topic、difficulty、tasks。
4. 成功后把状态显示为“练习已同步”。
5. 失败时保持未完成状态，并展示错误。

学生端不需要新增读取 API。已有 `loadStudentTodayPath` 读取 `/api/v1/student/today-path`，该接口会返回当日 `student_tasks`，因此下发任务会自然出现。

## Smoke 验收

新增检查：`teacher exercise visible to student today path`

流程：

1. 老师登录。
2. 学生登录。
3. 用学生 token 读取 `/api/v1/student/today-path` 获取 `studentId`。
4. 老师调用新增 API 给该学生写入唯一标题的 `exercise` 任务。
5. 学生再次读取 `/api/v1/student/today-path`。
6. 断言返回任务里存在同一标题，且 `taskType === "exercise"`。

## 文档同步

- `docs/phase2-priority-backlog-v4.1-internal-CN.md` 标记 P1-2 进展。
- `docs/phase2-daily-log-v4.1-internal-CN.md` 记录验证命令。
- `docs/ui-control-api-field-map.csv` 增加老师练习同步 API 映射。

## 非目标

- 不做题库管理。
- 不做自动判题。
- 不做学生提交答案闭环。
- 不新增 `student_tasks` 以外的数据表。

## 验证命令

- `npm run validate:contracts`
- `npm test`
- `npm run stack:verify`
- `npm run build`
- `npm run audit:deps`
- `npm run audit:dead-code`
- `npm run audit:security`
