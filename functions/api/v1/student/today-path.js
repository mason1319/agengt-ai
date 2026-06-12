import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../_shared/phase1Api.js';
import {
  fetchStudentTasksByStudent,
  fetchReviewByStudent,
  fetchLatestVoicePractice
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

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
  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }

  const today = new Date().toISOString().slice(0, 10);
  const [tasks, history, voice] = await Promise.all([
    fetchStudentTasksByStudent(env.DB, studentId, institutionId, today),
    fetchReviewByStudent(env.DB, studentId, institutionId, 20),
    fetchLatestVoicePractice(env.DB, studentId, auth.user?.id, institutionId)
  ]);

  return apiSuccess(
    {
      studentId,
      institutionId,
      today,
      tasks: tasks || [],
      reviewRecent: (history || []).slice(0, 5),
      voicePractice: voice || null
    },
    ctx
  );
}
