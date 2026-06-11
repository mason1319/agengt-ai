import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../_shared/phase1Api.js';
import { fetchPaymentRecordsByInstitution } from '../_shared/dbLayer.js';
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
  if (!['founder', 'platform'].includes(auth?.role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));
  if (!institutionId && auth.role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const rows = await fetchPaymentRecordsByInstitution(env.DB, {
    institutionId,
    studentId: STR(parsed.searchParams.get('studentId')),
    status: STR(parsed.searchParams.get('status'))
  });

  const safeRows = Array.isArray(rows) ? rows : [];
  const page = safeRows.slice(params.offset, params.offset + params.limit);
  return apiSuccess(
    {
      institutionId,
      total: safeRows.length,
      limit: params.limit,
      offset: params.offset,
      nextOffset: Math.min(safeRows.length, params.offset + params.limit),
      records: page
    },
    ctx
  );
}
