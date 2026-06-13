# StarMate 文档中心（v4.1 内部版）

本文是 `/docs` 目录的入口索引，用于说明每份文档的用途、维护人、更新频率和同步规则。当前 Phase 1 以内部机构自用 Web/H5/PWA 版本为交付目标。

## 当前主线

| 层级 | 文件 | 用途 | 维护人 | 更新频率 |
| --- | --- | --- | --- | --- |
| 主 PRD | `phase1-prd-starmate-english.md` | Phase 1 唯一产品验收源，定义范围、角色、成功目标和不做事项 | 产品负责人 | 每个 Sprint 开始前和范围变更时 |
| v4.1 内部补充 | `StarMate-PRD-v4.1-internal-CN.md` | 内部机构、课程、课时、缴费记录、统一素材库、招生咨询、AI 边界细化 | 产品负责人 | 内部运营规则变化时 |
| 架构 | `phase1-architecture-starmate-english.md` | Cloudflare Pages/Functions、D1、R2、鉴权、部署结构 | 架构负责人 | 架构或部署方式变化时 |
| 设计 | `StarMate-design-v4.1-internal-CN.md` | 页面结构、角色流程、交互状态、控件验收 | 设计负责人 | 页面或交互变更前 |
| 开发 SOP | `StarMate-dev-SOP-v4.1-CN.md` | 开发顺序、接口先行、门禁、回滚与合并阻塞项 | 技术负责人 | 流程或门禁变化时 |
| 运营 SOP | `StarMate-ops-SOP-v4.1-CN.md` | 账号、课程、线索、异常和日常运营处理 | 运营负责人 | 运营动作变化时 |
| 国际交付标准 | `international-delivery-standards-v4.1-internal.md` | 国际化质量、合约、体验、安全、证据门禁 | 技术负责人 | 门禁或合规标准变化时 |
| Phase 1 执行总表 | `phase1-execution-index-v4.1-internal.md` | 当前阶段主线、下一步、验收路径和阻塞项 | 项目负责人 | 每次阶段推进前 |

## 合同文件

| 文件 | 用途 | 维护人 | 更新触发 |
| --- | --- | --- | --- |
| `openapi-v4.1.yaml` | `/api/v1` 接口合同，定义路径、方法、请求、响应、错误码和权限 | 后端负责人 | 任何接口新增、修改、删除 |
| `../schema.sql` | D1 数据合同，定义表、字段、索引、审计和迁移依据 | 后端负责人 | 任何存储字段、表、索引或审计变化 |
| `ui-control-api-field-map.csv` | 控件-API-字段合同，绑定页面控件、接口、字段、权限和状态 | 前端负责人 | 任何按钮、输入、弹窗、导出、筛选、AI 操作入口变化 |

## 合规文件

| 文件 | 用途 | 维护人 |
| --- | --- | --- |
| `legal/StarMate-legal-compliance-index-v4.1-CN.md` | 合规总索引 | 合规负责人 |
| `legal/StarMate-privacy-policy-v4.1-CN.md` | 隐私政策 | 合规负责人 |
| `legal/StarMate-guardian-consent-v4.1-CN.md` | 未成年人监护人同意 | 合规负责人 |
| `legal/StarMate-data-security-policy-v4.1-CN.md` | 数据安全 | 合规负责人 |
| `legal/StarMate-ai-content-compliance-policy-v4.1-CN.md` | AI 内容安全 | 合规负责人 |
| `legal/StarMate-copyright-ip-policy-v4.1-CN.md` | 版权与知识产权 | 合规负责人 |
| `legal/StarMate-user-agreement-v4.1-CN.md` | 用户协议 | 合规负责人 |
| `legal/StarMate-qualification-filing-checklist-v4.1-CN.md` | 资质与备案检查 | 合规负责人 |

## 交付与运行文件

| 文件 | 用途 |
| --- | --- |
| `web-delivery-runbook.md` | Web 本地运行、部署、故障处理步骤 |
| `web-delivery-checklist.md` | Web 交付检查清单 |
| `web-delivery-signoff-template.md` | 交付签收模板 |
| `phase2-api-smoke-checklist.md` | API 烟测路径 |
| `phase1-chain-gap-checklist-v4.1-internal-CN.md` | Phase 1 闭环缺口检查 |

## 历史归档

| 文件 | 状态 | 使用规则 |
| --- | --- | --- |
| `StarMate-PRD-v4-CN.md` | 历史归档 | 保留 v4.0 合并草稿和早期工程宪法，不作为当前 Phase 1 唯一验收源 |
| `StarMate-PRD-v4-audit-CN.md` | 历史审计 | 用于追溯 v4.0 到 v4.1 的审计问题 |
| `StarMate-docs-audit-v4.1-CN.md` | 文档审计 | 用于追溯 v4.1 文档包检查结果 |

## 同步规则

1. 产品范围变化：同步主 PRD、v4.1 内部补充、设计文档、执行总表。
2. 页面控件变化：同步设计文档、`ui-control-api-field-map.csv`、OpenAPI、必要的 D1 schema。
3. 接口变化：同步 OpenAPI、Functions 路由、控件映射表、烟测清单。
4. 字段变化：同步 `schema.sql`、OpenAPI、控件映射表、迁移/回滚说明。
5. 合规变化：同步合规索引、对应法律文件、PRD 中的权限和数据边界。
6. 发布前：必须按 `international-delivery-standards-v4.1-internal.md` 输出证据包。

## Kick-off 检查项

首次 Sprint 启动前，团队必须确认：

1. 当前唯一验收源是 `phase1-prd-starmate-english.md`。
2. v4.1 内部补充只用于细化内部机构业务，不扩大 Phase 1 范围。
3. 每个文档有明确维护人。
4. 第一个 Sprint 的验收标准来自 `phase1-execution-index-v4.1-internal.md`。
5. 所有页面控件必须能在 `ui-control-api-field-map.csv` 中追踪到 API、字段、权限和状态。
