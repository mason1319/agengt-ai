import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../../_shared/phase1Api.js';
import {
  fetchStudentById,
  insertStudentTaskReview
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function normalizePriority(value = '') {
  const v = STR(value).toLowerCase();
  if (['low', 'medium', 'high'].includes(v)) {
    return v;
  }
  return 'medium';
}

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env, params } = ctx;

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const auth = await parseAuthContext(request, env);
  const role = STR(auth?.role).toLowerCase();
  if (!['teacher', 'founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const studentId = STR(params?.studentId);
  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const payload = await parseJsonBody(request);
  const interventionType = STR(payload?.interventionType);
  const action = STR(payload?.action);
  const note = STR(payload?.note);
  const dueAt = STR(payload?.dueAt);
  const priority = normalizePriority(payload?.priority);
  const channel = STR(payload?.channel || 'teacher');

  if (!interventionType || !action || !note) {
    return apiError('interventionType, action, note are required', 400, 400, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, studentId);
  if (!student) {
    return apiError('student not found', 404, 404, ctx);
  }

  if (role === 'teacher' && STR(student.teacherId) !== STR(auth?.user?.id)) {
    return apiError('No permission for this student', 403, 403, ctx);
  }

  const row = await insertStudentTaskReview(env.DB, {
    institutionId,
    studentId,
    taskType: 'intervention',
    title: `${interventionType}: ${action}`,
    answer: note,
    score: 0,
    status: 'pending',
    payload: {
      interventionType,
      action,
      dueAt: dueAt || null,
      priority,
      channel,
      source: role
    }
  });

  if (!row?.id) {
    return apiError('intervention submit failed', 500, 500, ctx);
  }

  return apiSuccess(
    {
      studentId,
      intervention: {
        id: row.id,
        type: interventionType,
        action,
        note,
        dueAt,
        priority,
        channel
      },
      createdAt: new Date().toISOString()
    },
    ctx
  );
}
