# 平台智能体中心导出标准说明

版本：`starmate.agent-runs.v1`

这份说明用于统一平台「智能体中心」的三类输出：

- `CSV 导出`
- `JSON 导出`
- `复制摘要`

三者必须保持同口径、同来源、同字段顺序，避免后续审计、复核、对表时出现歧义。

## 1. 适用范围

适用于平台页里的智能体运行记录导出，包含：

- 星守官
- 星语官
- 星练官
- 以及后续新增的可执行智能体

不适用于学生端练习明细、老师端课时记录、家长端成长报告等其它业务导出。

## 2. 导出原则

1. 每条记录必须可追溯。
2. 每份导出必须能看出来源页面。
3. 每份导出必须能看出角色、模型提供方、模型名称。
4. CSV、JSON、摘要三者字段口径必须一致。
5. 导出文件名必须带来源页面、范围、筛选项、日期。

## 3. 固定字段顺序

当前导出标准字段共 `26` 项，顺序固定如下：

1. `id` - 记录ID
2. `role` - 角色
3. `roleLabel` - 角色名称
4. `sourcePage` - 来源页面
5. `sourcePageLabel` - 来源页面名称
6. `aiProvider` - 模型提供方
7. `aiModel` - 模型名称
8. `runtimeContext` - 运行上下文
9. `time` - 时间
10. `agent` - 智能体
11. `action` - 动作
12. `status` - 状态
13. `input` - 输入
14. `output` - 输出
15. `api` - 接口
16. `resultType` - 结果类型
17. `title` - 标题
18. `contentSummary` - 内容摘要
19. `tasksSummary` - 任务摘要
20. `recommendationsSummary` - 建议摘要
21. `factorsSummary` - 因素摘要
22. `score` - 分数
23. `level` - 等级
24. `reward` - 奖励
25. `difficulty` - 难度
26. `riskSummary` - 风险摘要

## 4. JSON 标准结构

JSON 导出必须包含以下顶层结构：

- `meta`
- `exportSummary`
- `auditSchema`
- `columns`
- `summary`
- `normalizedRecords`
- `records`

### 4.1 `meta`

用于描述导出包自身。

推荐字段：

- `schemaVersion`
- `generatedAt`
- `scope`
- `filter`
- `filterLabel`
- `role`
- `roleLabel`
- `sourcePage`
- `sourcePageLabel`
- `aiProvider`
- `aiModel`
- `runtimeContext`
- `sourceSlug`
- `exportFileName`
- `summaryFileName`
- `exportFormat`
- `exportedCount`
- `totalCount`
- `product`
- `statusCounts`
- `resultTypeCounts`

### 4.2 `exportSummary`

用于让人快速看懂这份包。

推荐字段：

- `recordCount`
- `role`
- `roleLabel`
- `sourcePage`
- `sourcePageLabel`
- `aiProvider`
- `aiModel`
- `runtimeContext`
- `sourceSlug`
- `exportFileName`
- `summaryFileName`
- `filter`
- `filterLabel`
- `exportFormat`

### 4.3 `auditSchema`

用于审计或系统接档。

推荐字段：

- `version`
- `recordType`
- `exportFormat`
- `fieldOrder`
- `fieldLabels`
- `contextKeys`

当前 `contextKeys` 建议至少包含：

- `role`
- `roleLabel`
- `sourcePage`
- `sourcePageLabel`
- `aiProvider`
- `aiModel`
- `runtimeContext`
- `sourceSlug`
- `exportFileName`
- `summaryFileName`

## 5. 文件命名规则

导出文件名统一使用：

- `starmate-agent-runs-{sourceSlug}-{scope}-{filter}-{date}.csv`
- `starmate-agent-runs-{sourceSlug}-{scope}-{filter}-{date}.json`
- `starmate-agent-summary-{sourceSlug}-{date}.txt`

其中：

- `sourceSlug`：来源页面转小写短横线
- `scope`：`recent` 或 `all`
- `filter`：`all / success / failed / risk / practice / feedback`
- `date`：`YYYY-MM-DD`

## 6. 复制摘要规则

复制摘要必须包含：

- 一句话结论
- 来源页面
- 运行上下文
- 导出文件名
- 当前筛选
- 最近执行
- 成功 / 失败
- 平均得分
- 风险学员
- 最活跃智能体
- 最新结果摘要

## 7. 变更原则

以后如果新增字段，必须同步检查三处：

1. `CSV 导出`
2. `JSON 导出`
3. `复制摘要`

任何一处变更后，都不能让其它两处变成旧口径。

## 8. 当前状态

当前平台智能体中心已按以下原则运行：

- 输出字段已统一
- 来源页面已记录
- 模型上下文已记录
- 导出文件名已标准化
- `CSV / JSON / 摘要` 同口径
- 导出标准版本已固定为 `starmate.agent-runs.v1`

