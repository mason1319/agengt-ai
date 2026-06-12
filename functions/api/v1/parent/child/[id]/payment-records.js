import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../../../_shared/phase1Api.js';
import {
  fetchStudentById,
  fetchPaymentRecordsByInstitution
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env, params } = ctx;
  const childId = STR(params?.id);

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const auth = await parseAuthContext(request, env);
  if (!['parent', 'founder', 'platform'].includes(auth?.role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  if (!childId) {
    return apiError('child id required', 400, 400, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));
  if (!institutionId && auth?.role === 'parent') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (auth?.role === 'parent' && auth.user?.childId && auth.user.childId !== childId) {
    return apiError('No permission for this child', 403, 403, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, childId);
  if (!student) {
    return apiError('child not found', 404, 404, ctx);
  }

  const rowsRaw = await fetchPaymentRecordsByInstitution(env.DB, {
    institutionId,
    studentId: childId,
    status: STR(parsed.searchParams.get('status'))
  });
  const rows = Array.isArray(rowsRaw) ? rowsRaw : [];

  return apiSuccess(
    {
      studentId: childId,
      studentName: student.name,
      total: rows.length,
      records: rows
    },
    ctx
  );
}
