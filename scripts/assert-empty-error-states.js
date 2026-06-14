#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const source = readFileSync('src/main.jsx', 'utf8');

function sliceBetween(startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    console.error(`[empty-error-states] cannot isolate ${label}`);
    process.exit(1);
  }
  return source.slice(start, end);
}

const studentView = sliceBetween('function StudentView(', 'function HomePage(', 'StudentView');
const practicePage = sliceBetween('function PracticePage(', 'function ProfilePage(', 'PracticePage');
const appBlock = source.slice(source.indexOf('function App('));

const checks = [
  {
    label: 'StudentView accepts publicCoursesMessage',
    pass: /publicCoursesMessage\s*=\s*''/.test(studentView)
  },
  {
    label: 'StudentView shows public course failure distinct from empty state',
    pass: studentView.includes('公开课程加载失败，可点击刷新课程重试') && /publicCoursesMessage\s*\?/.test(studentView)
  },
  {
    label: 'PracticePage accepts practiceDataMessage',
    pass: /practiceDataMessage\s*=\s*''/.test(practicePage)
  },
  {
    label: 'PracticePage shows task failure distinct from empty state',
    pass: practicePage.includes('今日任务加载失败，可点击刷新任务重试')
      && /practiceDataMessage\s*(&&|\?)/.test(practicePage)
      && /if\s*\(\s*practiceDataMessage\s*\)\s*{\s*return\s+\[\]/.test(practicePage)
  },
  {
    label: 'App tracks publicCoursesMessage',
    pass: /const\s+\[\s*publicCoursesMessage\s*,\s*setPublicCoursesMessage\s*\]\s*=\s*useState\(''\)/.test(appBlock)
  },
  {
    label: 'App passes empty/error messages into StudentView and PracticePage',
    pass: appBlock.includes('publicCoursesMessage={publicCoursesMessage}') && appBlock.includes('practiceDataMessage={studentDataMessage}')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[empty-error-states] missing: ${check.label}`));
  process.exit(1);
}

console.log('[empty-error-states] checks passed');
