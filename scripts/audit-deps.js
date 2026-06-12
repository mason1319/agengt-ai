#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';

function readPkg() {
  const txt = readFileSync('package.json', 'utf8');
  return JSON.parse(txt);
}

function readLockDependencies() {
  if (!existsSync('package-lock.json')) {
    return new Set();
  }

  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const root = lock.packages?.[''] || {};
  return new Set(Object.keys(root.dependencies || {}).concat(Object.keys(root.devDependencies || {})));
}

function main() {
  const pkg = readPkg();
  const depNames = Object.keys(pkg.dependencies || {});
  const devDepNames = Object.keys(pkg.devDependencies || {});
  const lockDeps = readLockDependencies();

  const missing = [...depNames, ...devDepNames].filter((name) => !lockDeps.has(name));
  const unknown = [...lockDeps].filter((name) => name && !pkg.dependencies?.[name] && !pkg.devDependencies?.[name]);

  console.log('[audit-deps] dependency audit started');
  console.log(`[audit-deps] production deps: ${depNames.length}`);
  console.log(`[audit-deps] dev deps: ${devDepNames.length}`);

  if (missing.length) {
    console.log('[audit-deps] warn: dependencies missing in package-lock (run npm install):');
    missing.forEach((name) => console.log(`  - ${name}`));
  }

  if (unknown.length) {
    console.log('[audit-deps] warn: package-lock contains entries not in package.json:');
    unknown.slice(0, 20).forEach((name) => console.log(`  - ${name}`));
    if (unknown.length > 20) {
      console.log(`  ... ${unknown.length - 20} more`);
    }
  }

  if (missing.length === 0 && (unknown.length === 0 || unknown.length <= 0)) {
    console.log('[audit-deps] dependency declarations and lockfile are aligned');
  }

  console.log('[audit-deps] next step: run `npm audit` for vulnerability scan');
}

main();
process.exit(0);
