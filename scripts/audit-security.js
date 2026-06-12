#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function collectFiles(rootDirs = ['functions', 'src', 'docs', 'scripts']) {
  const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.md']);
  const result = [];

  const walk = (dir) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (exts.has(full.slice(full.lastIndexOf('.')))) {
        result.push(full);
      }
    }
  };

  for (const d of rootDirs) walk(d);
  return result;
}

function hasDotEnv() {
  return existsSync('.env') || existsSync('.env.local') || existsSync('.env.production');
}

function scanSecrets(files) {
  const patterns = [
    /AIza|AKIA|sk-[A-Za-z0-9_-]{16,}|sk_live_/i,
    /(?:\b(?:private[_-]?key|secret[_-]?key|access[_-]?token|api[_-]?key|jwt[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9._\-]{24,}["']?)/i,
  ];

  const hits = [];
  for (const file of files) {
    if (file === 'scripts/audit-security.js') {
      continue;
    }
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    for (const [idx, line] of lines.entries()) {
      if (patterns.some((re) => re.test(line))) {
        hits.push(`${file}:${idx + 1}`);
      }
    }
  }
  return hits;
}

function main() {
  const files = collectFiles();
  const secretHits = scanSecrets(files);

  console.log('[audit-security] baseline checks');
  console.log(`- .env file exists: ${hasDotEnv() ? 'yes' : 'no'}`);
  console.log(`- scanned text/code files: ${files.length}`);

  if (secretHits.length === 0) {
    console.log('[audit-security] no obvious secret pattern found in scanned files');
  } else {
    console.log('[audit-security] potential secret-like text found:');
    secretHits.slice(0, 20).forEach((item) => console.log(`  - ${item}`));
    if (secretHits.length > 20) {
      console.log(`  ... ${secretHits.length - 20} more`);
    }
  }

  console.log('[audit-security] ensure sensitive keys stay in Cloudflare Variables/Secrets, not source code');
  console.log('[audit-security] baseline security audit completed');
}

main();
process.exit(0);
