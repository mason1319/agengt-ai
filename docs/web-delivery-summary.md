# Aggie速记英语 Web 版第一阶段交付说明

## 交付范围（当前阶段）

- 产品形态：Aggie速记英语网页端内部可用原型（网页优先）
- 启动方式：`npm run web:dev`
- 交付产物：`dist`（由 `npm run web:deliver` 生成）
- 接口形态：真实登录 + D1/R2 接口联动，AI 仍先保持模拟输出
- 功能覆盖：创始人、老师、家长、学生、平台运营五角色基础页面与交互闭环

## 当前状态

- 生产域名已发布：`https://aggieai.me`、`https://www.aggieai.me`
- 本地构建已通过：`npm run web:build`
- 学生、老师、家长、创始人四个角色页已抽检通过
- 页面课程展示已收口：课程名、班型、费用、时间均可读

## 已完成项

- 角色切换
  - 创始人 / 老师 / 家长 / 学生 / 平台运营
- 核心看板与关键指标
  - 创始人：今天处理项、续费预警、在读学员、本月收入、今日消课、新试听线索
  - 老师：课表、授权学生、闭环按钮（消课/反馈/练习）
  - 家长：成长卡、学习总结、进步与强化建议、阶段报告
  - 学生：今日任务地图、闯关/积分体系卡片
  - 平台：机构列表、试用与到期态、套餐与AI用量、机构动作（转正式/延长试用/停用）
- 平台规则展示
  - 体验版/基础版/标准版/专业版
  - 学员/老师上限与AI额度在页面体现
  - 到期策略可见
- AI 运营审计增强
  - AI 审计日志支持按机构、动作、决策、用户ID、客户端IP、时间范围筛选
  - 审计列表支持分页与 CSV 导出
- 云端发布状态
  - Cloudflare Pages 已发布
  - 生产域名 `https://aggieai.me` 与 `https://www.aggieai.me` 已可访问
- 跨端规划（先规划后实现）
  - iOS/Android 使用 Capacitor 可后置接入
  - 小程序先以 H5 Webview 方式接入

## 验收口径（已按网页执行）

- 首屏非空
- 角色按钮完整可见且可点击
- 功能切换后页面内容发生变化
- 移动端无横向溢出
- 家长/老师敏感信息遵循脱敏展示
- 续费与套餐、到期逻辑在平台端可读可操作
- 平台 AI 审计日志区块可见、可筛选、可分页、可导出
- 本地 API 可通过 `/api/v1/admin/ai-audit` 与 Cloudflare 发布站点可访问

## 本阶段不做（故意后置）

- 真实 AI 接口接入
- 原生壳体打包与发布（iOS/Android）
- 微信小程序发布包

## 交付文件

- [README.md](/Users/mason/英语系统/README.md)
- [docs/web-delivery-checklist.md](/Users/mason/英语系统/docs/web-delivery-checklist.md)
- [docs/web-delivery-runbook.md](/Users/mason/英语系统/docs/web-delivery-runbook.md)
- [docs/phase1-prd-starmate-english.md](/Users/mason/英语系统/docs/phase1-prd-starmate-english.md)
- [docs/phase1-architecture-starmate-english.md](/Users/mason/英语系统/docs/phase1-architecture-starmate-english.md)
- [src/main.jsx](/Users/mason/英语系统/src/main.jsx)
- [src/styles.css](/Users/mason/英语系统/src/styles.css)

## 结论

本阶段交付口径：**网页、真实登录、D1/R2 基础联动与 Cloudflare 发布已完成，可直接用于内部演示与验收。**
原生壳体与更完整的真实 AI 仍留到下一阶段。
