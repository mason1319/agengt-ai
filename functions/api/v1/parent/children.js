import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../_shared/phase1Api.js';
import { fetchParentChildren, fetchStudentById } from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const auth = await parseAuthContext(request, env);
  if (!auth?.role || !auth.user?.id) {
    return apiError('Authentication required', 401, 401, ctx);
  }

  if (!['parent', 'founder', 'platform'].includes(auth.role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && ['parent'].includes(auth.role)) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const params = parseLimitOffset(request);

  if (auth.role === 'parent') {
    let children = (await fetchParentChildren(env.DB, institutionId, auth.user.id, params.limit)) || [];

    if ((!children || !children.length) && auth.user.childId) {
      const fallback = await fetchStudentById(env.DB, institutionId, auth.user.childId);
      if (fallback) {
        children = [
          {
            studentId: fallback.id,
            studentName: fallback.name,
            grade: fallback.grade,
            parentName: (fallback.parent && fallback.parent.id) || '家长'
          }
        ];
      } else {
        children = [];
      }
    }

    return apiSuccess({
      total: children.length,
      limit: params.limit,
      offset: params.offset,
      nextOffset: Math.min(children.length, params.offset + params.limit),
      children: (children || []).slice(params.offset, params.offset + params.limit)
    }, ctx);
  }

  const studentId = STR(parsed.searchParams.get('studentId'));
  const list = studentId
    ? [
      {
        studentId,
        studentName: '',
        grade: '',
        parentName: ''
      }
    ]
    : [];

  return apiSuccess({
    total: list.length,
    limit: params.limit,
    offset: params.offset,
    nextOffset: Math.min(list.length, params.offset + params.limit),
    children: list
  }, ctx);
}
