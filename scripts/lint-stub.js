#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'output']);

function walk(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (exts.has(extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

function collectIssues(files) {
  const issues = {
    todo: [],
    consoleLog: [],
    blank: [],
  };

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    if (lines.length > 0 && text.trim().length === 0) {
      issues.blank.push(file);
    }

    lines.forEach((line, index) => {
      if (line.includes('TODO')) {
        issues.todo.push(`${file}:${index + 1}`);
      }
      if (/\bconsole\.log\b/.test(line)) {
        issues.consoleLog.push(`${file}:${index + 1}`);
      }
    });
  }

  return issues;
}

function main() {
  const targets = ['src', 'functions'].filter(existsSync);
  const files = targets.flatMap((dir) => walk(dir));

  const issues = collectIssues(files);

  console.log(`[lint] scanned ${files.length} source files`);

  if (issues.consoleLog.length > 0) {
    console.error('[lint] blocking: console.log detected in application code:');
    issues.consoleLog.slice(0, 20).forEach((item) => console.error(`  - ${item}`));
    process.exit(1);
  }

  if (issues.todo.length > 0) {
    console.error('[lint] blocking: TODO detected in application code:');
    issues.todo.slice(0, 20).forEach((item) => console.error(`  - ${item}`));
    process.exit(1);
  }

  if (issues.blank.length > 0) {
    issues.blank.forEach((item) => console.log(`[lint] note: empty file -> ${item}`));
  }

  console.log('[lint] passed baseline application-code checks');
}

main();
