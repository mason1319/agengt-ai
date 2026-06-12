import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset,
  parseJsonBody
} from '../_shared/phase1Api.js';
import {
  fetchLessonAccountsByInstitution,
  adjustLessonAccount,
  fetchLatestLessonAccountByStudent
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();
const toSafeInt = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }

  return Math.round(num);
};

function summarizeLessonAccounts(rows = []) {
  return (rows || []).reduce(
    (
      acc,
      item
    ) => {
      acc.totalStudents += item?.student_id ? 1 : 0;
      acc.totalPurchased += toSafeInt(item?.purchased_hours, 0);
      acc.totalUsed += toSafeInt(item?.used_hours, 0);
      acc.totalRemaining += toSafeInt(item?.remaining_hours, 0);
      acc.totalHold += toSafeInt(item?.hold_hours, 0);
      return acc;
    },
    { totalStudents: 0, totalPurchased: 0, totalUsed: 0, totalRemaining: 0, totalHold: 0 }
  );
}

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

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && auth.role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method === 'GET') {
    const studentId = STR(parsed.searchParams.get('studentId'));
    const status = STR(parsed.searchParams.get('status'));

    const accounts = await fetchLessonAccountsByInstitution(env.DB, institutionId);
    const filtered = (Array.isArray(accounts) ? accounts : []).filter((item) => {
      if (studentId && STR(item.student_id) !== studentId) {
        return false;
      }

      if (status === 'active') {
        return toSafeInt(item?.remaining_hours, 0) > 0;
      }

      if (status === 'exhausted') {
        return toSafeInt(item?.remaining_hours, 0) <= 0;
      }

      return true;
    });

    const safeRows = filtered.slice(params.offset, params.offset + params.limit);
    return apiSuccess(
      {
        institutionId,
        total: filtered.length,
        limit: params.limit,
        offset: params.offset,
        nextOffset: Math.min(filtered.length, params.offset + params.limit),
        summary: summarizeLessonAccounts(filtered),
        items: safeRows
      },
      ctx
    );
  }

  if (request.method === 'POST') {
    const payload = await parseJsonBody(request);
    const studentId = STR(payload?.studentId);
    const purchasedHours = toSafeInt(payload?.purchasedHours, 0);
    const amountCents = toSafeInt(payload?.amountCents, 0);
    const reason = STR(payload?.reason);

    if (!studentId) {
      return apiError('studentId required', 400, 400, ctx);
    }

    if (purchasedHours <= 0) {
      return apiError('purchasedHours must be greater than 0', 400, 400, ctx);
    }

    if (!reason) {
      return apiError('reason required', 400, 400, ctx);
    }

    const record = await adjustLessonAccount(env.DB, {
      institutionId,
      studentId,
      purchasedHours,
      amountCents,
      reason
    });

    if (!record?.id) {
      return apiError('Adjust lesson account failed', 500, 500, ctx);
    }

    const updated = await fetchLatestLessonAccountByStudent(env.DB, studentId);

    return apiSuccess(
      {
        institutionId,
        adjusted: true,
        record: updated || record,
        reason
      },
      ctx
    );
  }

  return apiError('Method Not Allowed', 405, 405, ctx);
}
