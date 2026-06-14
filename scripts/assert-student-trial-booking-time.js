#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const source = readFileSync('src/main.jsx', 'utf8');
const studentStart = source.indexOf('function StudentView(');
const homeStart = source.indexOf('function HomePage(');

if (studentStart < 0 || homeStart < 0 || homeStart <= studentStart) {
  console.error('[student-trial-booking-time] cannot isolate StudentView block');
  process.exit(1);
}

const studentView = source.slice(studentStart, homeStart);
const checks = [
  {
    label: 'StudentView keeps a trialBookingTime state',
    pass: /const\s+\[\s*trialBookingTime\s*,\s*setTrialBookingTime\s*\]\s*=\s*useState\(''\)/.test(studentView)
  },
  {
    label: 'StudentView renders a visible booking time label',
    pass: studentView.includes('试听预约时间')
  },
  {
    label: 'StudentView renders a datetime-local input for booking time',
    pass: /type=["']datetime-local["']/.test(studentView)
  },
  {
    label: 'StudentView submits the selected booking time instead of only a fixed default',
    pass: /reservedAt:\s*selectedBookingTime/.test(studentView)
  },
  {
    label: 'StudentView explains the fallback booking time',
    pass: studentView.includes('未选择时默认安排明日同一时段')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  failed.forEach((check) => console.error(`[student-trial-booking-time] missing: ${check.label}`));
  process.exit(1);
}

console.log('[student-trial-booking-time] checks passed');
