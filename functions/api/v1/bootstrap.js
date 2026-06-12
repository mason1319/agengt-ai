import {
  buildRoleScopedPayload,
  jsonResponse,
  parseAuthContext
} from './_shared/runtimeData.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const authContext = await parseAuthContext(request, env, { allowRoleHint: true });
  const role = authContext?.role || 'founder';
  const roleScoped = await buildRoleScopedPayload(role, env, authContext);
  const aiMode = `${env?.AI_MODE || 'mock'}`.trim();
  const aiProvider = `${env?.AI_PROVIDER || ''}`.trim();
  const modeLabel = aiMode === 'mock'
    ? '模拟结果（先可用）'
    : aiProvider
      ? `云端配置 · ${aiProvider}`
      : '云端配置';

  return jsonResponse({
    success: true,
    source: 'api',
    role,
    data: {
      ...roleScoped
    },
    meta: {
      appName: env?.APP_NAME || 'Aggie速记英语',
      dataSource: env?.AI_MODE || 'mock',
      planCheckpoint: env?.PLAN_CHECKPOINT || 'trial,base,standard,pro',
      aiLimit: Number(env?.AI_DAILY_LIMIT || '5000'),
      aiProvider: aiProvider || 'mock',
      aiBaseUrl: `${env?.AI_BASE_URL || ''}`.trim(),
      aiModel: `${env?.AI_MODEL || 'mock'}`.trim(),
      role,
      modeLabel
    }
  });
}
