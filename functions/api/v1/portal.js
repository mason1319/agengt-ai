import {
  buildRoleScopedPayload,
  jsonResponse,
  parseAuthContext,
  normalizeRoleInput
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
  const role = authContext?.role || normalizeRoleInput('founder');
  const data = await buildRoleScopedPayload(role, env, authContext);

  return jsonResponse({
    success: true,
    role,
    data
  });
}
