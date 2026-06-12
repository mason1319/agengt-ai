# StarMate v4.1 Phase 2 P1 收口单（内部版）

## 一、当前状态（基于可复现验证）

- `npm run validate:contracts`：通过（76/76）
- `npm run stack:verify`：通过（20/20）
- `npm run audit:deps`：通过
- `npm run audit:dead-code`：通过（未发现空文件）
- 关键闭环清单：`docs/phase1-chain-gap-checklist-v4.1-internal-CN.md` 多数项目标注为已完成（含公开咨询、学生/老师/家长/创始人闭环、机构域）
- 现有阶段性收口文档：`docs/phase2-implementation-plan-starmate-english.md` 与 `docs/phase2-api-smoke-checklist.md`

## 二、按优先级判定的待修项

### P0（须立即清零）

1. **无此项**

### P1（本周修完）

1. **演示与生产数据源边界统一解释**
  - 风险：当前系统支持 demo/mock 回退与真实 API 双模式；当接口失败时会进入模拟回退，若不在交付说明中清晰标注，验收时容易被视为“非真实数据”。
  - 处置：已完成。
    - 冒烟与验收入口固定通过 `npm run stack:verify` 与 `npm run stack:verify`（strict/快速模式）进行；未启动服务时不作为“通过”解释。
    - 已在验收文档里加入 `demo-login` 与回退边界的可操作口径说明（`docs/phase2-api-smoke-checklist.md`）。
    - 新版本行为遵循：页面与 API 优先联通；仅后端不可达时才记录降级路径（记录于运行日志/复测文案）。

2. **验收命令可操作性**
  - 风险：`npm run verify:smoke` 直接运行时要求服务已启动；若未启动会返回 http 0。
  - 处置：已完成。已在验收清单和执行计划第一行固定 `npm run stack:verify`，并补充 strict 与快速复测命令示例。

3. **P1 运行日志统一**
  - 风险：开发环境与演示环境日志口径分散。
  - 处置：已完成。`stack:background` 保持 `/tmp/starmate-cf.log`，冒烟脚本新增执行元数据输出（token 来源、strict/skip、慢检排名）并进入收口记录。

### P2（不阻塞当前收口）

1. 报表导出后的视觉微调（图表样式、空态体验）
2. 平台侧运营细节优化（高级筛选、阈值提示文案）
3. 课程详情/练习页的高频动效和非关键装饰

## 三、Phase 2 本周执行（固定不扩展）

- `D1+R2` 对齐核验：沿 `founder -> teacher -> parent -> student -> public` 路径逐条复验一次。
- 端到端动作核验：每条按钮点击都要留有对应真实接口证据（stack:verify / 真实页面点击日志 / 接口返回）。
- 风险闭环：若发现“页面无动作/请求 404/空响应未回显”问题，先加上“修复接口”再恢复 UI。
- 每日固定输出：`phase2-daily-log-v4.1-internal-CN.md`（可临时创建）记录当日修复项与复测结果。

## 四、下次建议执行步骤

1. 若新增关键闭环，更新 `docs/phase2-api-smoke-checklist.md` 与 `docs/ui-control-api-field-map.csv` 映射。
2. 复测一次 `npm run stack:verify`，确认 20 项通过。
   - 默认：`npm run stack:verify`
   - Strict：`SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false npm run stack:verify`
3. 每日输出复盘到 `docs/phase2-daily-log-v4.1-internal-CN.md`，与验证命令同批次留痕。
4. 提交验收签名前，仅新增 P2 优化项不再进入本次收口范围。

## 五、本轮追加复验（2026-06-12）

- 已执行：`npm run lint` ✅（通过基线校验）
- 已执行：`npm run typecheck` ✅（基线通过）
- 已执行：`npm run build` ✅（构建成功）
- 已执行：`npm run audit:security` ✅（未发现新增明显敏感文本；建议持续人工复核密钥管理）
- 已执行：`npm run validate:contracts && npm run verify:smoke:auto` ✅（20/20）

## 六、Phase2 风险结论（阶段内）

- P0：无阻断项
- P1：已缓解（2026-06-12 已完成 P1 1-3 的闭环化可验证改造；持续复用 strict 模式）
- P1 补充：`docs/phase2-daily-log-v4.1-internal-CN.md` 15:20 扫描确认 `ui-control-api-field-map.csv` 与 `openapi-v4.1.yaml` 路径一致（52/52），未发现新增映射缺口
- P2：文案/品牌统一与非关键装饰优化、部分 mock 退化词条展示需按阶段优化（不阻塞当前收口）
