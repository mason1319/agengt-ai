import { getDemoUserByRole, parseAuthContext, jsonResponse } from './_shared/runtimeData.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role;
  if (!role) {
    return jsonResponse({ success: false, error: 'Auth required' }, 401);
  }

  const demoUser = auth?.user || getDemoUserByRole(role);
  const hasAuthData = auth?.user?.id && auth?.user?.name;
  const fallbackUser = {
    id: `demo-${role}`,
    role,
    name: role === 'platform' ? '平台管理员' : `demo-${role}`
  };

  return jsonResponse({
    success: true,
    data: {
      user: hasAuthData ? demoUser || fallbackUser : demoUser || fallbackUser
    }
  });
}
