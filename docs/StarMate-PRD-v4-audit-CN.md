# 星伴英语 StarMate PRD v4.0 审计报告

**审计对象**：`docs/phase1-prd-starmate-english.md`
**审计日期**：2026-06-06
**审计结论**：方向成立，但 v4.0 仍是“战略型 PRD”，不能直接进入完整开发。用户已明确当前只做本机构内部自用，暂时取消商用 SaaS，因此整改重点从“商业化”调整为“内部教学闭环、儿童合规、数据模型、成本控制、MVP 验收边界”。

---

## 1. 总体判断

| 维度 | 结论 | 说明 |
|---|---|---|
| 产品方向 | 可行 | 从教培 SaaS 转向 AI 英语私教是正确方向，学生端作为第一用户成立。 |
| MVP 可落地性 | 需整改 | Phase 1 同时包含口语、评测、自适应、PWA、家长小程序、老师看板、云端基础设施，3 个月范围过大。 |
| 技术路线 | 基本可行 | React/Vite/Cloudflare/D1/R2 可做第一版，但 D1 数据模型、实时通信、PWA 离线语音需要细化。 |
| 合规风险 | 高 | 产品写 4-16 岁，但 Phase 1 又写仅 13+，这与儿童教育产品定位冲突。 |
| 内部成本模型 | 需重算 | 暂停外部套餐后，仍需控制 AI 分钟、音频存储、模型调用和老师人工干预成本。 |
| 进入开发建议 | 有条件通过 | 必须先整改 P0 项，再进入接口设计和原型开发。 |

---

## 2. P0 必改项

### P0-1：目标年龄与儿童合规冲突

**位置**：`docs/phase1-prd-starmate-english.md:189`、`docs/phase1-prd-starmate-english.md:337`、`docs/phase1-prd-starmate-english.md:857`

**问题**：PRD 同时写了“学生 4–16 岁”和“Phase 1 仅 13 岁以上，13 岁以下 COPPA 推迟到 Phase 3”。如果产品要服务 4–12 岁儿童，不能把儿童隐私、家长授权、语音采集同意放到后面。

**风险**：核心目标用户无法进入第一版验证；如果实际收集 13 岁以下儿童语音/学习数据，会形成高合规风险。

**整改建议**：
- 路线 A：Phase 1 明确只做 13–16 岁，不宣传 4–12 岁能力。
- 路线 B：Phase 1 就加入儿童模式：家长账号创建儿童档案、家长授权、语音采集同意、数据导出/删除、最小化采集、默认关闭社交。
- 建议选路线 B，因为你的项目本质是少儿英语。

### P0-2：Phase 1 范围过大

**位置**：`docs/phase1-prd-starmate-english.md:1146`、`docs/phase1-prd-starmate-english.md:1155`

**问题**：3 个月内同时做 AI 口语、15 分钟评测、自适应路径、学生 PWA、家长小程序、老师看板、Cloudflare 基础设施，交付风险过高。

**整改建议**：拆成两个内测阶段。

| 阶段 | 周期 | 必做范围 |
|---|---|---|
| Phase 1A | 4-6 周 | Web 学生端、后台登录、今日任务、语音上传、规则化评分、学习事件落库、基础驾驶舱 |
| Phase 1B | 4-6 周 | 家长周报、老师异常看板、FSRS 复习队列、R2 音频、审计日志 |

**第一版验收口径**：不要同时验收“小程序、完整写作、完整阅读、原生 App、文化墙”。

### P0-3：AI 承诺与 Mock 阶段冲突

**位置**：`docs/phase1-prd-starmate-english.md:66`、`docs/phase1-prd-starmate-english.md:626`、`docs/phase1-prd-starmate-english.md:1213`

**问题**：PRD 对外定位是“AI 英语私教、7×24 老师”，但 Phase 1 明确是 Mock + 规则引擎。如果不定义“模拟 AI 的可接受边界”，用户会觉得是假功能。

**整改建议**：
- Phase 1 定义为“规则化 AI 内测”，只验证流程闭环。
- 增加 AI 评测集：发音样本、阅读题准确率、写作批改一致性、安全样本。
- 增加 AI 输出质量门槛：准确率、延迟、拒答、误判率、人工复核率。

### P0-4：Cloudflare D1 数据模型写法不准确

**位置**：`docs/phase1-prd-starmate-english.md:937`、`docs/phase1-prd-starmate-english.md:954`、`docs/phase1-prd-starmate-english.md:986`

**问题**：数据模型写了 `JSONB`，但 D1 是 SQLite 体系，JSON 数据应按 TEXT 存储并用 JSON 函数或生成列查询。大量能力画像和任务结果直接塞 JSON，会导致后期统计、索引和权限审计困难。

**整改建议**：
- 把 `JSONB` 全部改为 `TEXT(JSON)`。
- 高频查询字段拆表或生成列：能力维度、课程来源、任务状态、评分、弱点标签。
- 学习事件、错题、发音分数、FSRS 复习记录必须有独立表，不能全部藏在 JSON。

### P0-5：内部成本控制与 AI 分钟不匹配

**位置**：`docs/phase1-prd-starmate-english.md:1108`、`docs/phase1-prd-starmate-english.md:1122`、`docs/phase1-prd-starmate-english.md:1133`

**问题**：当前已取消对外收费套餐，但学生日均 15 分钟学习仍会带来真实 AI、ASR/TTS、R2 存储和老师干预成本。若不设内部配额，系统上线后成本会不可控。

**整改建议**：
- 重新定义“AI 分钟”：区分总学习分钟、语音评分分钟、真实大模型对话分钟。
- 建立内部预算：每生每日 AI 语音评分 5–10 分钟、对话 3–5 轮，超出进入规则化降级。
- 第一阶段不做支付、套餐购买、年付和对外试用，只做内部用量看板。

---

## 3. P1 重要整改项

### P1-1：教材版权与内容来源需要前置

**位置**：`docs/phase1-prd-starmate-english.md:744`、`docs/phase1-prd-starmate-english.md:745`、`docs/phase1-prd-starmate-english.md:746`

**问题**：PRD 写了牛津、新概念、K12 同步内容，但没有写授权来源、机构上传版权责任、AI 改写边界。

**整改建议**：新增“内容版权与来源治理”章节，明确自建内容、授权内容、机构上传内容、公开材料的边界。

### P1-2：AI 风险管理还不够工程化

**位置**：`docs/phase1-prd-starmate-english.md:592`、`docs/phase1-prd-starmate-english.md:699`

**问题**：已有 AI 护栏和内容安全规则，但缺少 AI 风险分级、测试集、红队测试、事故分级、人工复核闭环。

**整改建议**：按“Govern / Map / Measure / Manage”补一章 AI 风险管理：
- Govern：谁审批提示词、模型、供应商。
- Map：哪些场景会伤害儿童、误导学习、泄露隐私。
- Measure：用什么测试集量化质量。
- Manage：出问题后如何下线、回滚、通知。

### P1-3：安全规范需要从口号变成 ASVS 检查表

**位置**：`docs/phase1-prd-starmate-english.md:852`、`docs/phase1-prd-starmate-english.md:867`

**问题**：PRD 写了 JWT、RBAC、审计、幂等，但缺 CSRF、文件上传安全、R2 签名 URL、速率限制矩阵、密钥轮换、备份恢复、租户越权测试。

**整改建议**：新增安全验收清单：
- 登录：密码策略、失败锁定、刷新 token 轮换。
- API：每个接口限频、越权测试、租户隔离测试。
- 上传：文件类型校验、大小限制、病毒/敏感内容扫描、R2 私有桶 + 临时签名 URL。
- 数据：备份、恢复演练、删除策略、审计导出。

### P1-4：无障碍不应推迟到 Phase 2

**位置**：`docs/phase1-prd-starmate-english.md:111`

**问题**：PRD 只把无障碍放到 Phase 2。儿童学习产品需要从第一版就保证基础可用性，尤其是按钮尺寸、焦点、颜色对比、语音/字幕替代。

**整改建议**：Phase 1 直接要求 WCAG 2.2 AA 基线：键盘可用、焦点明显、表单错误可理解、颜色不作为唯一信息、音频内容有文本反馈。

### P1-5：技术路线里 SSE、WebSocket、Durable Objects 混用

**位置**：`docs/phase1-prd-starmate-english.md:604`、`docs/phase1-prd-starmate-english.md:895`、`docs/phase1-prd-starmate-english.md:918`

**问题**：对话协议写 SSE，但架构图写 WebSocket + Durable Objects。第一版如果没有真实双向实时协作，SSE 足够；引入 DO 会增加部署和本地调试复杂度。

**整改建议**：
- Phase 1：统一为 HTTP + SSE + 异步 Job。
- Phase 2：如需要多人实时课堂或强状态对话，再加入 Durable Objects。

### P1-6：“零自定义 CSS 文件”表述过硬

**位置**：`docs/phase1-prd-starmate-english.md:82`、`docs/phase1-prd-starmate-english.md:1286`

**问题**：shadcn/ui + Tailwind 通常仍需要一个全局样式入口承载 Tailwind 指令和 CSS variables。完全禁止 `.css` 文件会和工程实际冲突。

**整改建议**：改成“仅允许 `src/styles/globals.css` 或等价全局入口，用于 Tailwind base/components/utilities 和 shadcn token；禁止业务页面自定义 CSS 文件。”

---

## 4. P2 优化项

### P2-1：KPI 需要补埋点事件字典

**位置**：`docs/phase1-prd-starmate-english.md:320`

**建议**：新增事件字典：`session_start`、`task_assigned`、`voice_uploaded`、`score_returned`、`task_completed`、`path_updated`、`parent_report_opened`、`teacher_intervention_submitted`。

### P2-2：运营后台还缺基础管理动作

**位置**：`docs/phase1-prd-starmate-english.md:1058`

**建议**：补齐老师/学生导入、家长绑定、重置密码、R2 素材审核、数据导出、账号停用、内部配额调整。

### P2-3：课程测评标准需要可验证

**位置**：`docs/phase1-prd-starmate-english.md:467`、`docs/phase1-prd-starmate-english.md:544`

**建议**：CEFR、蓝思值、K12 年级、牛津/新概念标签不能只做展示字段；需要建立映射规则和抽检机制。

### P2-4：文化墙应放在 Phase 2/3，不进入 MVP

**位置**：`docs/phase1-prd-starmate-english.md:509`、`docs/phase1-prd-starmate-english.md:1181`

**建议**：文化墙是增长和品牌模块，不是 AI 学习主闭环。第一版保留数据结构，不做页面开发。

---

## 5. 建议的新执行顺序

1. v4.1 PRD 整改：修正年龄/合规、MVP 范围、D1 模型、内部成本控制、AI 风险管理。
2. 输出 OpenAPI 合约：先写接口请求/响应/错误码/权限，不先做页面。
3. 输出 D1 逻辑模型：用 D1 可执行字段替代 JSONB。
4. Figma 只画 Phase 1A 页面：学生首页、口语练习、任务结果、后台登录、基础驾驶舱。
5. 开发 Phase 1A：只做 Web + Cloudflare + D1 + R2 + Mock/规则 AI。
6. 内测 20 名学生：收集真实学习事件、评分延迟、任务完成率、家长理解度。

---

## 6. 是否适合继续做

**适合继续做，但必须收窄。**

这个产品最适合先做成“AI 口语 + 自适应复习”的学生端学习产品，再逐步叠加老师/家长/机构运营。不要第一版就同时做完整 SaaS、完整课程体系、完整多端、完整文化墙、完整大模型。

第一版要证明三件事：

1. 学生愿意每天打开。
2. AI/规则反馈让学生知道自己哪里错。
3. 家长看得懂孩子进步，机构内部愿意长期使用。

只要这三件事成立，再扩展阅读、写作、老师看板、文化墙、真实大模型。

---

## 7. 参考标准

- NIST AI Risk Management Framework：AI 风险治理、测量、管理。
- OWASP ASVS：Web/API 安全验证。
- W3C WCAG 2.2：Web 可访问性。
- FTC COPPA：13 岁以下儿童在线隐私保护。
- Cloudflare D1 文档：D1 JSON 数据以 TEXT 存储并通过 JSON 函数/生成列查询。
