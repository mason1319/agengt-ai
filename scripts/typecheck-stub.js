#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function runTypeCheck() {
  const configFile = 'tsconfig.typecheck.json';
  if (!existsSync(configFile)) {
    console.error(`[typecheck] ${configFile} not found.`);
    return 1;
  }

  const res = spawnSync('npx', ['tsc', '-p', configFile, '--pretty', 'false'], { stdio: 'pipe', shell: false, encoding: 'utf8' });
  if (res.error) {
    console.error('[typecheck] failed to run tsc:', res.error.message);
    return 1;
  }

  if (res.status !== 0) {
    console.error(res.stdout || '');
    console.error(res.stderr || '');
    console.error('[typecheck] scoped static typecheck failed');
    return 1;
  }

  console.log((res.stdout || '').trim());
  console.log('[typecheck] passed for functions/scripts/config baseline');
  return 0;
}

process.exit(runTypeCheck());
