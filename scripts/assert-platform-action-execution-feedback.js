#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const appConfig = readFileSync('src/config/appConfig.js', 'utf8');
const runtimeDataService = readFileSync('src/services/runtimeDataService.js', 'utf8');
const main = readFileSync('src/main.jsx', 'utf8');
const seedData = readFileSync('src/seedData.js', 'utf8');
const docs = readFileSync('docs/phase2-daily-log-v4.1-internal-CN.md', 'utf8');

const applyStart = main.indexOf('const applyOrgAction = async (org, action, localPatch = {}) => {');
const applyEnd = main.indexOf('const platformAdminPage = (', applyStart);
const adminStart = main.indexOf('function PlatformAdmin(');
const overviewStart = main.indexOf('function PlatformOverview(', adminStart);

if (applyStart < 0 || applyEnd < 0 || adminStart < 0 || overviewStart < 0) {
  console.error('[platform-action-execution-feedback] cannot isolate platform action sections');
  process.exit(1);
}

const applyOrgAction = main.slice(applyStart, applyEnd);
const platformAdmin = main.slice(adminStart, overviewStart);
const oldLabelChecks = [
  "action?.label === '延长试用'",
  "action?.label === '停用'",
  "action?.label === '试用演练'",
  "action?.label === '转正式'",
  "action?.label === '续费恢复'"
];

const checks = [
  {
    label: 'appConfig exports platform action result helper',
    pass: /export\s+function\s+getPlatformOrgActionResultText/.test(appConfig)
      && appConfig.includes('已执行')
      && appConfig.includes('状态已更新为')
      && appConfig.includes('到期策略：')
  },
  {
    label: 'runtimeDataService maps actionKey to API action',
    pass: runtimeDataService.includes('const actionKey =')
      && runtimeDataService.includes("actionKey === 'extend'")
      && runtimeDataService.includes("actionKey === 'freeze'")
      && runtimeDataService.includes("actionKey === 'convert'")
      && runtimeDataService.includes("basePatch.action = 'extend_trial'")
      && runtimeDataService.includes("basePatch.action = 'suspend'")
      && runtimeDataService.includes("basePatch.action = org?.status === ORG_STATUS.expired ? 'activate' : 'upgrade'")
  },
  {
    label: 'runtimeDataService no longer depends on old action labels',
    pass: oldLabelChecks.every((snippet) => !runtimeDataService.includes(snippet))
  },
  {
    label: 'seed platform organizations have stable ids for local action feedback',
    pass: /id:\s*'org_main'/.test(seedData)
      && /id:\s*'org_trial'/.test(seedData)
      && /id:\s*'org_expired'/.test(seedData)
  },
  {
    label: 'main imports platform action result helper',
    pass: /getPlatformOrgActionResultText/.test(main)
  },
  {
    label: 'applyOrgAction sets success message after local update',
    pass: /setPlatformActionMessage\(successText\)/.test(applyOrgAction)
      && /appendOperationLog\('platform',\s*successText\)/.test(applyOrgAction)
  },
  {
    label: 'applyOrgAction records fallback feedback when cloud sync fails',
    pass: /const fallbackText = `\$\{successText\}（本地已回填，云端同步失败：/.test(applyOrgAction)
      && /setPlatformActionMessage\(fallbackText\)/.test(applyOrgAction)
      && /appendOperationLog\('platform',\s*fallbackText\)/.test(applyOrgAction)
  },
  {
    label: 'applyOrgAction uses normalized action label in success result',
    pass: /getPlatformOrgActionResultText\(\{[\s\S]*action[\s\S]*patch/.test(applyOrgAction)
  },
  {
    label: 'PlatformAdmin does not log action before execution finishes',
    pass: !/执行机构动作/.test(platformAdmin)
  },
  {
    label: 'docs record action execution feedback closure',
    pass: docs.includes('platform.action.execution-feedback')
      && docs.includes('成功提示、最近操作日志和机构列表回填')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[platform-action-execution-feedback] missing: ${check.label}`));
  process.exit(1);
}

console.log('[platform-action-execution-feedback] checks passed');
