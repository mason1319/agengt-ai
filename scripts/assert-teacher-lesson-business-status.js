#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const source = readFileSync('src/main.jsx', 'utf8');
const start = source.indexOf('function TeacherWorkspace(');
const end = source.indexOf('function ParentView(', start);

if (start < 0 || end < 0 || end <= start) {
  console.error('[teacher-lesson-business-status] cannot isolate TeacherWorkspace');
  process.exit(1);
}

const teacherWorkspace = source.slice(start, end);
const checks = [
  {
    label: 'TeacherWorkspace defines business status helper',
    pass: /const\s+getLessonBusinessStatus\s*=\s*\(lesson\)\s*=>/.test(teacherWorkspace)
  },
  {
    label: 'business status includes prep/feedback/exercise/closed labels',
    pass: ['待课前准备', '反馈待同步', '练习待下发', '课堂已闭环'].every((text) => teacherWorkspace.includes(text))
  },
  {
    label: 'lesson cards render business status label',
    pass: /getLessonBusinessStatus\(lesson\)\.label/.test(teacherWorkspace)
  },
  {
    label: 'selected lesson summary renders business status detail',
    pass: /getLessonBusinessStatus\(currentLesson\)\.detail/.test(teacherWorkspace)
  },
  {
    label: 'lesson cards no longer render only three-state status helper',
    pass: !/<small[^>]*>\s*{\s*getLessonCardStatusLabel\(lesson\)\s*}\s*<\/small>/s.test(teacherWorkspace)
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[teacher-lesson-business-status] missing: ${check.label}`));
  process.exit(1);
}

console.log('[teacher-lesson-business-status] checks passed');
