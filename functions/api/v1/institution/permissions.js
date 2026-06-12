import {
  fetchPermissionsByInstitution,
  fetchUserById,
  grantPermission,
  revokePermission
} from '../_shared/dbLayer.js';
import { jsonResponse, parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value) => `${value || ''}`.trim();
const ALLOWED_PERMISSION_CODES = new Set([
  'STUDENT_VIEW',
  'STUDENT_EDIT',
  'TEACHER_VIEW',
  'LESSON_VIEW',
  'LESSON_CREATE',
  'LESSON_EDIT',
  'LEAD_VIEW',
  'LEAD_EDIT',
  'PAYMENT_VIEW',
  'PAYMENT_EDIT',
  'WALL_VIEW',
  'WALL_UPLOAD',
  'PERMISSION_VIEW',
  'PERMISSION_GRANT',
  'AI_AGENT_USE',
  'AI_AUDIT_VIEW'
]);

function resolveInstitutionId(auth, requestUrl, explicit) {
  const parsed = new URL(requestUrl);
  const queryInst = STR(parsed.searchParams.get('institutionId'));
  if (explicit) {
    return STR(explicit);
  }
  if (queryInst) {
    return queryInst;
  }
  return STR(auth?.user?.institutionId) || (auth?.role === 'platform' ? '' : 'inst-star');
}

function normalizePermissionCode(value) {
  const code = STR(value).toUpperCase();
  if (!code) {
    return '';
  }
  return /^[A-Z0-9_\.:-]{2,64}$/.test(code) ? code : '';
}

function parsePayload(request, url) {
  return request
    .json()
    .then((json) => ({
      userId: STR(json?.userId),
      permissionCode: normalizePermissionCode(json?.permissionCode)
    }))
    .catch(() => ({
      userId: STR(url.searchParams.get('userId')),
      permissionCode: normalizePermissionCode(url.searchParams.get('permissionCode'))
    }));
}

function assertPermissionCode(code) {
  return !code || ALLOWED_PERMISSION_CODES.has(code) ? code : '';
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';

  if (!['platform', 'founder'].includes(role)) {
    return jsonResponse({ success: false, error: 'No permission' }, 403);
  }

  if (!env?.DB && request.method !== 'GET') {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const url = new URL(request.url);
  const institutionId = resolveInstitutionId(auth, request.url, url.searchParams.get('institutionId'));

  if (!institutionId) {
    return jsonResponse({ success: false, error: 'institutionId required' }, 400);
  }

  if (request.method === 'GET') {
    const filters = {
      institutionId,
      userId: STR(url.searchParams.get('userId'))
    };

    const rows = await fetchPermissionsByInstitution(env.DB, filters);

    return jsonResponse({
      success: true,
      total: rows.length,
      data: {
        permissionCodes: Array.from(ALLOWED_PERMISSION_CODES),
        permissions: rows
      }
    });
  }

  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const payload = await parsePayload(request, url);
  if (!payload.userId || !payload.permissionCode) {
    return jsonResponse({
      success: false,
      error: 'userId and permissionCode are required (permissionCode format: [A-Z0-9_.:-]{2,64})'
    }, 400);
  }

  const permissionCode = assertPermissionCode(payload.permissionCode);
  if (!permissionCode) {
    return jsonResponse({
      success: false,
      error: 'Invalid permissionCode. allowed codes: '
        + Array.from(ALLOWED_PERMISSION_CODES).join(', ')
    }, 400);
  }

  const targetUser = await fetchUserById(env.DB, payload.userId, role === 'platform' ? undefined : institutionId);
  if (!targetUser) {
    return jsonResponse({ success: false, error: 'target user not found' }, 404);
  }

  if (role === 'founder' && STR(targetUser.institutionId || targetUser.institution_id) !== institutionId) {
    return jsonResponse({ success: false, error: 'No permission for target user' }, 403);
  }

  if (request.method === 'POST') {
    const ok = await grantPermission(env.DB, {
      userId: payload.userId,
      permissionCode
    });

    const latest = await fetchPermissionsByInstitution(env.DB, {
      institutionId,
      userId: payload.userId
    });

    return jsonResponse({
      success: true,
      data: {
        userId: payload.userId,
        permissionCode,
        granted: !!ok,
        permissions: latest
      }
    });
  }

  const ok = await revokePermission(env.DB, {
    userId: payload.userId,
    permissionCode
  });
  const latest = await fetchPermissionsByInstitution(env.DB, {
    institutionId,
    userId: payload.userId
  });

  return jsonResponse({
    success: true,
    data: {
      userId: payload.userId,
      permissionCode,
      revoked: !!ok,
      permissions: latest
    }
  });
}
