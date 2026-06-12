import {
  DEMO_TOKENS,
  getDemoUserByRole,
  issueSessionToken,
  jsonResponse,
  normalizeRoleInput,
  resolveUserByCredential
} from '../_shared/runtimeData.js';

const VALID_ROLES = Object.keys(DEMO_TOKENS);

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const payload = await request.json().catch(() => ({}));
  const username = `${payload?.username || ''}`.trim();
  const password = `${payload?.password || ''}`.trim();
  const inputRole = normalizeRoleInput(payload?.role || '');
  const allowDemoLogin = `${env?.ALLOW_DEMO_LOGIN || ''}`.trim().toLowerCase() === 'true';

  if (username || password) {
    if (!username || !password) {
      return jsonResponse(
        {
          success: false,
          error: 'username and password are required'
        },
        400
      );
    }

    const user = await resolveUserByCredential(env, username, password);
    if (!user) {
      return jsonResponse({ success: false, error: 'Invalid username or password' }, 401);
    }

    const userRole = normalizeRoleInput(user.role);
    if (!userRole) {
      return jsonResponse({ success: false, error: 'User role invalid' }, 403);
    }

    if (inputRole && inputRole !== userRole) {
      return jsonResponse({ success: false, error: 'Role mismatch' }, 403);
    }

    const token = await issueSessionToken(env, userRole, user);

    return jsonResponse({
      success: true,
      mode: 'jwt',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: userRole,
          institutionId: user.institutionId
        }
      }
    });
  }

  if (!allowDemoLogin) {
    return jsonResponse(
      {
        success: false,
        error: 'Please provide username and password'
      },
      400
    );
  }

  if (!inputRole) {
    return jsonResponse(
      {
        success: false,
        error: 'Invalid role',
        roles: VALID_ROLES
      },
      400
    );
  }

  const demoUser = getDemoUserByRole(inputRole);
  const fallbackUser = {
    id: `demo-${inputRole}`,
    name: inputRole === 'platform' ? '平台管理员' : `demo-${inputRole}`,
    role: inputRole
  };

  return jsonResponse({
    success: true,
    mode: 'demo',
    data: {
      token: DEMO_TOKENS[inputRole],
      user: demoUser
        ? {
            id: demoUser.id,
            username: demoUser.username,
            role: demoUser.role,
            name: demoUser.name,
            institutionId: demoUser.institutionId
          }
        : fallbackUser
    }
  });
}
