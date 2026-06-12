#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function listFiles(dir, exts = ['.js', '.jsx', '.ts', '.tsx']) {
  if (!existsSync(dir)) return [];

  const out = [];
  const files = readdirSync(dir, { withFileTypes: true });

  for (const entry of files) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, exts));
    } else {
      const ext = full.slice(full.lastIndexOf('.'));
      if (exts.includes(ext)) out.push(full);
    }
  }

  return out;
}

function containsExport(content, symbol) {
  return new RegExp(`\\b(export\\s+(const|function|class|let|var)|module\\.exports|export\\s*default)\\b`).test(content);
}

function isLikelyUnused(file, allSources) {
  const content = readFileSync(file, 'utf8');
  const hasExport = containsExport(content);
  return !hasExport && /^(?!.*(main|run|bootstrap))/s.test(file) && content.trim().length === 0;
}

function main() {
  const srcFiles = listFiles('src');
  const fnFiles = listFiles('functions');
  const all = [...srcFiles, ...fnFiles];

  const ignored = new Set([
    ...srcFiles.filter((f) => f.includes('index.') || f.includes('main.')),
  ]);

  const dead = all
    .filter((file) => file.includes('.ts') || file.includes('.js') || file.includes('.tsx') || file.includes('.jsx'))
    .filter((f) => !ignored.has(f) && readFileSync(f, 'utf8').trim().length === 0);

  console.log('[audit-dead-code] scanned src/functions for empty source files (bootstrap baseline)');
  console.log(` - inspected: ${all.length}`);

  if (dead.length === 0) {
    console.log('[audit-dead-code] no empty source files found');
    return 0;
  }

  console.log('[audit-dead-code] warning: found unused/empty files');
  dead.forEach((file) => console.log(` - ${file}`));
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error('[audit-dead-code] failed:', error.message);
  process.exit(1);
}
