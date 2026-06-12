import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../../../_shared/phase1Api.js';
import {
  fetchStudentById,
  fetchParentMessages,
  insertParentMessage
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
  if (!['parent', 'founder', 'platform', 'student'].includes(auth?.role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (!childId) {
    return apiError('child id required', 400, 400, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));
  if (!institutionId && auth?.role === 'parent') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const currentChildId = STR(auth?.user?.childId || auth?.user?.studentId);
  if ((auth?.role === 'parent' || auth?.role === 'student') && currentChildId && currentChildId !== childId) {
    return apiError('No permission for this child', 403, 403, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, childId);
  if (!student) {
    return apiError('child not found', 404, 404, ctx);
  }

  if (request.method === 'GET') {
    const limit = Math.max(1, Math.min(50, Number(parsed.searchParams.get('limit')) || 20));
    const messages = await fetchParentMessages(env.DB, {
      institutionId,
      studentId: childId,
      limit
    });

    return apiSuccess(
      {
        studentId: childId,
        studentName: student.name,
        total: Array.isArray(messages) ? messages.length : 0,
        messages: messages || []
      },
      ctx
    );
  }

  if (request.method === 'POST') {
    const payload = await request.json().catch(() => ({}));
    const message = STR(payload.message);
    if (!message) {
      return apiError('message required', 400, 400, ctx);
    }

    const created = await insertParentMessage(env.DB, {
      institutionId,
      studentId: childId,
      actorRole: STR(payload.actorRole || auth?.role || 'parent'),
      sender: STR(payload.sender || auth?.user?.name || auth?.user?.username || ''),
      message,
      tone: STR(payload.tone || '高情商'),
      relatedLessonId: STR(payload.relatedLessonId)
    });

    if (!created) {
      return apiError('Create message failed', 500, 500, ctx);
    }

    return apiSuccess(
      {
        studentId: childId,
        message: created
      },
      ctx
    );
  }

  return apiError('Method Not Allowed', 405, 405, ctx);
}
