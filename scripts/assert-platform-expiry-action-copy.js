#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const appConfig = readFileSync('src/config/appConfig.js', 'utf8');
const main = readFileSync('src/main.jsx', 'utf8');
const seedData = readFileSync('src/seedData.js', 'utf8');
const docs = readFileSync('docs/unclosed-ui-controls-v4.1-internal-CN.md', 'utf8');

const adminStart = main.indexOf('function PlatformAdmin(');
const overviewStart = main.indexOf('function PlatformOverview(');
const plansStart = main.indexOf('function PlatformPlansPage(');
const aiStart = main.indexOf('function PlatformAiPage(', plansStart);

if (adminStart < 0 || overviewStart < 0 || plansStart < 0 || aiStart < 0) {
  console.error('[platform-expiry-action-copy] cannot isolate platform sections');
  process.exit(1);
}

const platformAdmin = main.slice(adminStart, overviewStart);
const platformOverview = main.slice(overviewStart, plansStart);
const platformPlans = main.slice(plansStart, aiStart);
const canonicalLabels = ['转正式运营', '延长试用期', '转只读观察', '冻结新操作'];
const forbiddenMixedCopy = ['续费恢复', '试用演练', '停用', '到期后冻结 + 提示开通', '到期后只读', '只读/冻结'];

const checks = [
  {
    label: 'appConfig exports canonical platform expiry action copy',
    pass: /export\s+const\s+PLATFORM_EXPIRY_ACTION_COPY/.test(appConfig)
      && /export\s+const\s+PLATFORM_EXPIRY_POLICY_TEXT/.test(appConfig)
  },
  {
    label: 'appConfig exports expiry action normalizers',
    pass: /export\s+function\s+getPlatformExpiryActionLabel/.test(appConfig)
      && /export\s+function\s+getPlatformExpiryPolicyText/.test(appConfig)
  },
  {
    label: 'canonical labels are present',
    pass: canonicalLabels.every((label) => appConfig.includes(label))
  },
  {
    label: 'main imports expiry action helpers',
    pass: /getPlatformExpiryActionLabel/.test(main) && /getPlatformExpiryPolicyText/.test(main)
  },
  {
    label: 'PlatformAdmin renders normalized policy and action labels',
    pass: /getPlatformExpiryPolicyText\(org\)/.test(platformAdmin)
      && /getPlatformExpiryActionLabel\(action\)/.test(platformAdmin)
  },
  {
    label: 'PlatformOverview renders normalized policy text',
    pass: /getPlatformExpiryPolicyText\(org\)/.test(platformOverview)
  },
  {
    label: 'PlatformPlansPage renders normalized defaults and actions',
    pass: /getPlatformExpiryPolicyText\(\{\s*\.\.\.defaults,\s*status\s*\}\)/.test(platformPlans)
      && /getPlatformExpiryActionLabel\(action\)/.test(platformPlans)
  },
  {
    label: 'seed organizations use canonical policy text',
    pass: canonicalLabels.some((label) => seedData.includes(label))
      && !seedData.includes('到期后冻结 + 提示开通')
  },
  {
    label: 'docs record platform expiry action wording closure',
    pass: docs.includes('platform.expiry.actions') && canonicalLabels.every((label) => docs.includes(label))
  },
  {
    label: 'old mixed copy removed from platform sections and config',
    pass: forbiddenMixedCopy.every((copy) => !`${appConfig}\n${platformAdmin}\n${platformOverview}\n${platformPlans}`.includes(copy))
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[platform-expiry-action-copy] missing: ${check.label}`));
  process.exit(1);
}

console.log('[platform-expiry-action-copy] checks passed');
