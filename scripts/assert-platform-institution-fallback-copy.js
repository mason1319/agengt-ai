#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const appConfig = readFileSync('src/config/appConfig.js', 'utf8');
const docs = readFileSync('docs/unclosed-ui-controls-v4.1-internal-CN.md', 'utf8');

const checks = [
  {
    label: 'platform institution fallback uses polished copy',
    pass: main.includes('机构名称待完善')
  },
  {
    label: 'platform institution fallback does not expose old 待补齐 copy',
    pass: !main.includes('机构名称待补齐')
  },
  {
    label: 'platform institution fallback does not expose unnamed institution copy',
    pass: !main.includes('未命名机构')
      && !appConfig.includes('未命名机构')
  },
  {
    label: 'docs record platform institution fallback closure',
    pass: docs.includes('platform.institution-name.fallback')
      && docs.includes('机构名称待完善')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[platform-institution-fallback-copy] missing: ${check.label}`));
  process.exit(1);
}

console.log('[platform-institution-fallback-copy] checks passed');
