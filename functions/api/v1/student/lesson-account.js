import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../_shared/phase1Api.js';
import { fetchLessonAccountsByInstitution } from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function computeTotal(accounts = []) {
  const merged = Array.isArray(accounts) ? accounts : [];
  return merged.reduce(
    (acc, item) => {
      acc.purchased += Number(item?.purchased_hours || 0);
      acc.remaining += Number(item?.remaining_hours || 0);
      return acc;
    },
    { purchased: 0, remaining: 0 }
  );
}

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const auth = await parseAuthContext(request, env);
  if (!auth || auth.role !== 'student') {
    return apiError('Student role required', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const studentId = STR(auth.user?.studentId || parsed.searchParams.get('studentId'));
  const institutionId = STR(auth.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!studentId || !institutionId) {
    return apiError('studentId and institutionId required', 400, 400, ctx);
  }

  const rows = await fetchLessonAccountsByInstitution(env.DB, institutionId);
  const list = Array.isArray(rows)
    ? rows.filter((row) => STR(row.student_id) === studentId)
    : [];
  const summary = computeTotal(list);

  return apiSuccess({
    studentId,
    accounts: list,
    summary
  }, ctx);
}
