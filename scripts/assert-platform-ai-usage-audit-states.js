#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const docs = readFileSync('docs/unclosed-ui-controls-v4.1-internal-CN.md', 'utf8');

const pageStart = main.indexOf('function PlatformAiPage(');
const pageEnd = main.indexOf('function LandingAndPricing(', pageStart);
const appStart = main.indexOf('function App(');

if (pageStart < 0 || pageEnd < 0 || appStart < 0) {
  console.error('[platform-ai-usage-audit-states] cannot isolate platform ai sections');
  process.exit(1);
}

const platformAiPage = main.slice(pageStart, pageEnd);
const appBlock = main.slice(appStart);

const checks = [
  {
    label: 'PlatformAiPage computes usage and audit filter summaries',
    pass: /const usageFilterSummary = \[/.test(platformAiPage)
      && /const auditFilterSummary = \[/.test(platformAiPage)
      && /const usageExportSummary =/.test(platformAiPage)
      && /const auditExportSummary =/.test(platformAiPage)
  },
  {
    label: 'PlatformAiPage receives active role context',
    pass: /activeRole = 'platform'/.test(platformAiPage)
      && /<PlatformAiPage[\s\S]*activeRole=\{activeRole\}/.test(appBlock)
  },
  {
    label: 'PlatformAiPage does not depend on agent-center local state',
    pass: !/quickStats|selectedAgent(Action|Meta)?|runningAgentName|triggerAgent|selectedRun/.test(platformAiPage)
  },
  {
    label: 'AI usage panel renders current filter and export scope',
    pass: platformAiPage.includes('AI 用量当前筛选：')
      && platformAiPage.includes('AI 用量导出范围：')
      && /usageFilterSummary\.join\(' · '\)/.test(platformAiPage)
      && /usageExportSummary/.test(platformAiPage)
  },
  {
    label: 'AI audit panel renders current filter and export scope',
    pass: platformAiPage.includes('AI 审计当前筛选：')
      && platformAiPage.includes('AI 审计导出范围：')
      && /auditFilterSummary\.join\(' · '\)/.test(platformAiPage)
      && /auditExportSummary/.test(platformAiPage)
  },
  {
    label: 'AI usage empty state names current filters',
    pass: platformAiPage.includes('当前筛选无 AI 用量记录，可调整机构或时间范围后刷新')
  },
  {
    label: 'AI audit empty state names current filters',
    pass: platformAiPage.includes('当前筛选无审计日志，可调整用户、动作、决策或时间范围后刷新')
  },
  {
    label: 'empty export messages use current filter language',
    pass: appBlock.includes('当前筛选下暂无可导出的 AI 用量报表，请调整机构或时间范围后重试')
      && appBlock.includes('当前筛选下暂无可导出的 AI 审计报表，请调整用户、动作或时间范围后重试')
  },
  {
    label: 'docs record platform ai usage audit state closure',
    pass: docs.includes('platform.ai-usage-audit.states')
      && docs.includes('当前筛选 / 导出范围 / 空态提示')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[platform-ai-usage-audit-states] missing: ${check.label}`));
  process.exit(1);
}

console.log('[platform-ai-usage-audit-states] checks passed');
