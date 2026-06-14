#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const docs = readFileSync('docs/unclosed-ui-controls-v4.1-internal-CN.md', 'utf8');

const founderStart = main.indexOf('function FounderDashboard(');
const founderEnd = main.indexOf('function TeacherWorkspace(', founderStart);

if (founderStart < 0 || founderEnd < 0 || founderEnd <= founderStart) {
  console.error('[founder-lead-guardian-copy] cannot isolate FounderDashboard');
  process.exit(1);
}

const founderDashboard = main.slice(founderStart, founderEnd);

const checks = [
  {
    label: 'founder lead guardian fallback uses polished copy',
    pass: founderDashboard.includes('家长姓名待完善')
  },
  {
    label: 'founder lead guardian fallback does not expose old copy',
    pass: !founderDashboard.includes('未填写家长名')
  },
  {
    label: 'docs record founder lead guardian fallback closure',
    pass: docs.includes('founder.leads.guardian-fallback')
      && docs.includes('家长姓名待完善')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[founder-lead-guardian-copy] missing: ${check.label}`));
  process.exit(1);
}

console.log('[founder-lead-guardian-copy] checks passed');
