import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../_shared/phase1Api.js';
import {
  fetchReviewByStudent,
  insertStudentTaskReview
} from '../../_shared/dbLayer.js';
import { parseAuthContext } from '../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function findExistingPathCompletion(items = [], pathId = '', title = '') {
  const normalizedPathId = STR(pathId);
  const normalizedTitle = STR(title);
  return (Array.isArray(items) ? items : []).find((item) => {
    const payload = item?.payload || {};
    return (
      STR(item.taskType || item.task_type) === 'path_completion'
      && (
        (normalizedPathId && STR(payload.pathId) === normalizedPathId)
        || (normalizedTitle && STR(item.title) === normalizedTitle)
      )
    );
  });
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

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const auth = await parseAuthContext(request, env);
  if (!auth || auth.role !== 'student') {
    return apiError('Student role required', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const studentId = STR(auth.user?.studentId || parsed.searchParams.get('studentId'));
  const institutionId = STR(auth.user?.institutionId || parsed.searchParams.get('institutionId'));
  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }
  if (!institutionId) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const payload = await parseJsonBody(request);
  const title = STR(payload?.title);
  const pathId = STR(payload?.payload?.pathId || payload?.pathId);
  const answer = STR(payload?.answer);
  const taskType = STR(payload?.taskType || 'path_completion') || 'path_completion';
  const score = Math.max(0, Math.round(Number(payload?.score || 0)));
  const status = STR(payload?.status || 'done') || 'done';

  if (!title) {
    return apiError('title is required', 400, 400, ctx);
  }

  const existing = await fetchReviewByStudent(env.DB, studentId, institutionId, 100);
  const matched = findExistingPathCompletion(existing, pathId, title);
  if (matched?.id) {
    return apiSuccess(
      {
        studentId,
        item: matched,
        updatedAt: matched.updatedAt || matched.createdAt || new Date().toISOString()
      },
      ctx
    );
  }

  const row = await insertStudentTaskReview(env.DB, {
    institutionId,
    studentId,
    taskType,
    title,
    answer,
    score,
    status,
    payload: {
      ...(payload?.payload || {}),
      pathId: pathId || null,
      taskType,
      source: STR(payload?.payload?.source || 'student_home_path'),
      submittedAt: new Date().toISOString()
    }
  });

  if (!row?.id) {
    return apiError('path completion submit failed', 500, 500, ctx);
  }

  return apiSuccess(
    {
      studentId,
      item: {
        id: row.id,
        taskType: row.taskType,
        title: row.title,
        answer: row.answer,
        score: row.score,
        status: row.status,
        payload: {
          pathId,
          source: 'student_home_path'
        }
      },
      createdAt: new Date().toISOString()
    },
    ctx
  );
}
