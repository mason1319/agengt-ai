# StarMate 英语系统 Phase 1 执行总表（v4.1 国际标准）

## 1. 本阶段主线（单一执行锚点）
- 主 PRD：`docs/phase1-prd-starmate-english.md`
- v4.1 内部补充：`docs/StarMate-PRD-v4.1-internal-CN.md`
- 架构：`docs/phase1-architecture-starmate-english.md`
- 设计：`docs/StarMate-design-v4.1-internal-CN.md`
- 研发 SOP：`docs/StarMate-dev-SOP-v4.1-CN.md`
- 运营 SOP：`docs/StarMate-ops-SOP-v4.1-CN.md`
- 合规索引：`docs/legal/StarMate-legal-compliance-index-v4.1-CN.md`
- 接口合同：`docs/openapi-v4.1.yaml`
- 数据合同：`schema.sql`
- 控件合同：`docs/ui-control-api-field-map.csv`
- 国际执行标准：`docs/international-delivery-standards-v4.1-internal.md`
- 文档中心：`docs/README.md`

## 2. 执行规则（任何改动都必须遵守）
1. 仅有 `docs/phase1-prd-starmate-english.md` 作为验收源。
2. 任何控件变更必须同步更新：`docs/ui-control-api-field-map.csv`。
3. 任何接口变更必须同步更新：`docs/openapi-v4.1.yaml`。
4. 任何存储字段变更必须同步更新：`schema.sql`。
5. 任何阶段切换都需在提交说明中说明“门禁通过情况”。
6. `docs/StarMate-PRD-v4-CN.md` 仅作为历史归档，不覆盖 v4.1 主线。

## 3. 阶段性验收门槛（交付前必须确认）
- 登录鉴权：`/api/v1/auth/*` + token 续期 + 会话过期处理。
- 数据真实性：公开页面、学生首页、老师异常、家长汇总、创始人看板均为真实接口驱动。
- 安全边界：
  - 老师不能看完整家长联系方式；
  - 家长只能看绑定学生；
  - 公开咨询不能访问内部学生系统。
- 体验：375px 下不横向溢出，关键操作有 Loading/Empty/Error/Success 四态。
- 可追溯：每条关键交互有 `request_id/trace_id`。

## 4. 风险与阻塞项（出现即回退）
- 空按钮、无效控件、仅演示态组件。
- 模拟回退仅用于本地服务不可用时的兜底，不得替代主链路真实接口展示。
- 接口缺失但页面存在对应交互。
- 映射表三元组不完整（控件-接口-字段）。
- 明确文案与实际接口行为不一致。

### 4.1 违规项分类与处理时限

| 等级 | 判定标准 | 处理时限 | 阶段影响 |
| --- | --- | --- | --- |
| 致命 P0 | 越权、未成年人隐私泄露、登录链路断裂、核心数据写错或丢失 | 4 小时内下线入口，24 小时内修复或回滚 | 阻断发布和阶段验收 |
| 严重 P1 | 核心闭环断裂、控件/API/字段不一致、关键异常态缺失 | 1 个工作日内修复 | 阻断阶段验收 |
| 一般 P2 | 文案、格式、低风险体验问题 | 3 个工作日内修复 | 进入缺口清单，不阻断低风险内部演示 |

## 5. Sprint 1 验收标准

### 5.1 代码侧
1. 统一登录态与角色路由。
2. 补齐学生/家长/老师/创始人最小闭环接口链路。
3. 对标 `ui-control-api-field-map.csv` 清理旧控件。
4. 公开咨询只保留课程查看、咨询提交、AI/规则化答疑、试听预约与线索跟进，不出现在线支付或公开注册。

### 5.2 验收侧
1. 生成一版“控件-接口-字段”缺口扫描报告。
2. 提供 5 条角色闭环演示路径：
   - 咨询用户：咨询提交 → AI 回应 → 预约 → 线索接管
   - 学生：任务拉取 → 提交评分 → 回填结果
   - 老师：异常查看 → 学生详情 → 干预提交 → 结果同步
   - 家长：孩子概况 → 课程/课时 → 成长摘要 → 沟通反馈
   - 创始人：看板查看 → 线索接管 → 课时/收费对账
3. 出具本地运行截图/录屏 + `/api/v1` 成功和失败请求证据。
4. 运行 `npm run validate:contracts`、`npm run stack:verify`，无法运行时必须说明环境原因和替代证据。

## 6. Kick-off 输出物

Kick-off 结束后必须留下三项文档化结果：

1. 文档维护人确认：以 `docs/README.md` 的维护表为准。
2. Sprint 1 验收标准确认：以本文第 5 节为准。
3. 未决问题清单：写入阶段交付报告或 `docs/phase1-kickoff-checklist-v4.1-internal.md`。
