#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const docs = readFileSync('docs/unclosed-ui-controls-v4.1-internal-CN.md', 'utf8');

const coursesPageStart = main.indexOf('function CoursesPage(');
const coursesPageEnd = main.indexOf('function PracticePage(', coursesPageStart);

if (coursesPageStart < 0 || coursesPageEnd < 0 || coursesPageEnd <= coursesPageStart) {
  console.error('[founder-course-drawer-copy] cannot isolate CoursesPage');
  process.exit(1);
}

const coursesPage = main.slice(coursesPageStart, coursesPageEnd);

const checks = [
  {
    label: 'founder course drawer uses polished unnamed-course fallback',
    pass: coursesPage.includes('课程名称待完善')
  },
  {
    label: 'founder course drawer does not expose old unnamed-course copy',
    pass: !coursesPage.includes('未命名课程')
  },
  {
    label: 'docs record founder course drawer fallback closure',
    pass: docs.includes('founder.course-drawer.name-fallback')
      && docs.includes('课程名称待完善')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[founder-course-drawer-copy] missing: ${check.label}`));
  process.exit(1);
}

console.log('[founder-course-drawer-copy] checks passed');
