import { jsonResponse } from './_shared/runtimeData.js';

const resolveR2 = (env = {}) => env?.ASSETS || env?.STAR_MATE_ASSETS;

export async function onRequest(context) {
  const { env } = context;
  const r2Bucket = resolveR2(env);

  const checks = {
    db: {
      bound: Boolean(env?.DB),
      ok: false
    },
    r2: {
      bound: Boolean(r2Bucket),
      ok: false
    }
  };

  if (env?.DB) {
    try {
      const { results } = await env.DB.prepare('SELECT 1 as ok').all();
      checks.db.ok = Array.isArray(results) && results.length > 0;
    } catch {
      checks.db.ok = false;
    }
  }

  if (r2Bucket) {
    try {
      checks.r2.ok = typeof r2Bucket.list === 'function';
    } catch {
      checks.r2.ok = false;
    }
  }

  return jsonResponse({
    status: 'ok',
    appName: env?.APP_NAME || 'Aggie速记英语',
    appEnv: env?.APP_ENV || 'production',
    now: new Date().toISOString(),
    checks
  });
}
