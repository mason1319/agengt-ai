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

function normalizeTasks(value) {
  if (Array.isArray(value)) {
    return value.map((item) => STR(item)).filter(Boolean).slice(0, 20);
  }
  const single = STR(value);
  return single ? [single] : [];
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

  if (!institutionId) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const payload = await parseJsonBody(request);
  const tasks = normalizeTasks(payload?.tasks);
  const title = STR(payload?.title || payload?.topic || '课后练习');
  const lessonId = STR(payload?.lessonId);
  const topic = STR(payload?.topic);
  const difficulty = STR(payload?.difficulty || 'medium');

  if (!title && tasks.length === 0) {
    return apiError('title or tasks required', 400, 400, ctx);
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
    taskType: 'exercise',
    title,
    answer: '',
    score: 0,
    status: 'pending',
    payload: {
      tasks,
      source: 'teacher_exercise',
      lessonId: lessonId || null,
      topic: topic || null,
      difficulty,
      generatedAt: new Date().toISOString(),
      sourceRole: role
    }
  });

  if (!row?.id) {
    return apiError('exercise assign failed', 500, 500, ctx);
  }

  return apiSuccess(
    {
      studentId,
      task: {
        id: row.id,
        taskType: row.taskType,
        title: row.title,
        status: row.status,
        payload: {
          tasks,
          lessonId,
          topic,
          difficulty
        }
      },
      createdAt: new Date().toISOString()
    },
    ctx
  );
}
