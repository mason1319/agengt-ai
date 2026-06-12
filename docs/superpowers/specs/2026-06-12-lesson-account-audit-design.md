# Phase 2 P1-3 课时调整审计与扣减明细设计

## 背景

Phase 2 P1-3 要补齐内部课时变更留痕和老师消课反馈。当前创始人课时调整已经写入 `lesson_accounts.notes`，老师点名也会消课，但缺少稳定验收项和清晰的扣减明细返回。

## 目标

- 创始人调整课时时必须填写原因，并可在记录中看到该原因。
- 老师提交到课/迟到后，接口返回本次扣减小时数、扣前余额、扣后余额。
- 家长/创始人看到的课时余额与老师点名后的余额一致。
- smoke 增加“无原因调整被拒绝”和“老师点名返回扣减明细”。

## 推荐方案

复用现有 `lesson_accounts` 表：

- `notes` 作为本阶段调整原因字段。
- 不新增 `lesson_account_adjustments` 表。
- 不做财务级审计流水。

老师点名接口增强返回：

`POST /api/v1/teacher/courses/{courseId}/attendance`

在 `summary.lessons[]` 中为每个成功扣课学生返回：

- `hoursDeducted`
- `beforeRemaining`
- `afterRemaining`
- `accountId`
- `lesson`

## 后端规则

### 创始人课时调整

现有 `POST /api/v1/founder/lesson-accounts` 保持：

- `studentId` 必填。
- `purchasedHours > 0`。
- `reason` 必填。
- 成功后写入 `lesson_accounts.notes`。

补充 smoke 来固定该规则。

### 老师点名扣减

对 `attended` / `late`：

1. `ensureLessonAccountEnough(studentId, 1)` 返回扣前账户。
2. 新增课次 `lessons`。
3. `consumeLessonAccount(studentId, account.id, 1)` 扣减。
4. 重新读取最新账户，计算 `afterRemaining`。
5. 返回扣减明细。

对 `absent` / `leave`：

- 只记录到课状态，不扣课时。
- `summary.lessons` 不新增扣减明细。

## 前端规则

老师端完成记录后，如果接口返回扣减明细：

- 当前课程点名提示显示：`扣减 1 节，剩余 X 节`。
- 批量点名仍保留成功/失败数量，并可在后续 detail 中查看明细。

## Smoke 验收

新增两项检查：

1. `founder lesson account adjustment requires reason`
   - 无 `reason` 调整课时返回 400。
2. `teacher attendance returns deduction detail`
   - 老师提交到课。
   - 断言 `summary.lessons[0].hoursDeducted === 1`。
   - 断言 `beforeRemaining - afterRemaining === 1`。

## 文档同步

- `docs/openapi-v4.1.yaml`：更新相关接口说明。
- `docs/ui-control-api-field-map.csv`：保持字段说明包含 `reason`、扣减明细字段。
- `docs/phase2-priority-backlog-v4.1-internal-CN.md`：标记 P1-3 进展。
- `docs/phase2-daily-log-v4.1-internal-CN.md`：记录验证。

## 非目标

- 不新增财务审计表。
- 不做在线支付。
- 不做退费、冻结、赠课的完整财务模型。
- 不改学生/家长课时查询接口的数据结构。

## 验证命令

- `npm run validate:contracts`
- `npm test`
- `npm run stack:verify`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run audit:deps`
- `npm run audit:dead-code`
- `npm run audit:security`
