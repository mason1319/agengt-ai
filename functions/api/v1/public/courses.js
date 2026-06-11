import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../_shared/phase1Api.js';
import {
  fetchCourses
} from '../_shared/dbLayer.js';

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

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);

  const result = await fetchCourses(env.DB, {
    institutionId: STR(parsed.searchParams.get('institutionId')),
    limit: params.limit,
    offset: params.offset,
    grade: STR(parsed.searchParams.get('grade')),
    status: STR(parsed.searchParams.get('status')),
    classType: STR(parsed.searchParams.get('classType'))
  });

  const safeResult = result || {};
  return apiSuccess({
    institutionId: STR(parsed.searchParams.get('institutionId')),
    courses: safeResult.items || [],
    total: Number(safeResult.total || 0),
    limit: Number(safeResult.limit || params.limit || 50),
    offset: Number(safeResult.offset || params.offset || 0),
    nextOffset: Number(safeResult.nextOffset || 0)
  }, ctx);
}
