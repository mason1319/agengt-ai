#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const formatters = readFileSync('src/utils/formatters.js', 'utf8');

function sliceBetween(startMarker, endMarker, label) {
  const start = main.indexOf(startMarker);
  const end = main.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    console.error(`[lesson-account-display] cannot isolate ${label}`);
    process.exit(1);
  }
  return main.slice(start, end);
}

const founderDashboard = sliceBetween('function FounderDashboard(', 'function TeacherWorkspace(', 'FounderDashboard');
const profilePage = sliceBetween('function ProfilePage(', 'function CultureWallPage(', 'ProfilePage');

const checks = [
  {
    label: 'formatters export normalizeLessonHours',
    pass: /export\s+function\s+normalizeLessonHours/.test(formatters)
  },
  {
    label: 'formatters export normalizePaidAmount',
    pass: /export\s+function\s+normalizePaidAmount/.test(formatters)
  },
  {
    label: 'main imports lesson account display helpers',
    pass: main.includes('normalizeLessonHours') && main.includes('normalizePaidAmount')
  },
  {
    label: 'FounderDashboard formats recent remaining hours',
    pass: /normalizeLessonHours\(recentLessonAdjustment\?/.test(founderDashboard)
  },
  {
    label: 'FounderDashboard formats account remaining hours',
    pass: /normalizeLessonHours\(account\?/.test(founderDashboard)
  },
  {
    label: 'ProfilePage formats lesson hours through helper',
    pass: /lessonHoursText\s*=\s*normalizeLessonHours/.test(profilePage)
  },
  {
    label: 'ProfilePage formats paid amount through helper',
    pass: /lessonAccountPaidAmountText\s*=\s*normalizePaidAmount/.test(profilePage)
  },
  {
    label: 'ProfilePage no longer renders raw paidAmount as metric note',
    pass: !/note=\{`\$\{lessonAccount\?\.summary\?\.paidAmount\s*\|\|\s*lessonAccount\?\.paidAmount/.test(profilePage)
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[lesson-account-display] missing: ${check.label}`));
  process.exit(1);
}

console.log('[lesson-account-display] checks passed');
