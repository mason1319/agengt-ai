#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const formatters = readFileSync('src/utils/formatters.js', 'utf8');
const start = main.indexOf('function FounderDashboard(');
const end = main.indexOf('function TeacherWorkspace(', start);

if (start < 0 || end < 0 || end <= start) {
  console.error('[expiry-renewal-display] cannot isolate FounderDashboard');
  process.exit(1);
}

const founderDashboard = main.slice(start, end);
const checks = [
  {
    label: 'formatters export normalizeExpiryRenewalDates',
    pass: /export\s+function\s+normalizeExpiryRenewalDates/.test(formatters)
  },
  {
    label: 'expiry helper returns due and renewal labels',
    pass: formatters.includes('到期日：') && formatters.includes('续期日：')
  },
  {
    label: 'main imports normalizeExpiryRenewalDates',
    pass: /normalizeExpiryRenewalDates/.test(main)
  },
  {
    label: 'FounderDashboard derives payment expiry display',
    pass: /normalizeExpiryRenewalDates\(record\)/.test(founderDashboard)
  },
  {
    label: 'FounderDashboard renders expiry and renewal display in payment row',
    pass: /expiryRenewalDisplay\.dueText/.test(founderDashboard) && /expiryRenewalDisplay\.renewalText/.test(founderDashboard)
  },
  {
    label: 'docs no longer keep old single expiry wording as active new copy',
    pass: !/\| `founder\.payment-records\.expiry` \| `到期日待确认`/.test(readFileSync('docs/unclosed-ui-controls-v4.1-internal-CN.md', 'utf8'))
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[expiry-renewal-display] missing: ${check.label}`));
  process.exit(1);
}

console.log('[expiry-renewal-display] checks passed');
