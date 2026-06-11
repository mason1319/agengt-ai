import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../../_shared/phase1Api.js';
import { fetchReviewByStudent, fetchStudentTasksByStudent } from '../../_shared/dbLayer.js';
import { parseAuthContext } from '../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function toSummary(tasks = []) {
  const total = tasks.length;
  const done = tasks.filter((item) => STR(item.status) === 'done').length;
  const averageScore = total ? (tasks.reduce((acc, item) => acc + Number(item.score || 0), 0) / total) : 0;
  return {
    total,
    done,
    doneRate: total ? Math.round((done / total) * 100) : 0,
    averageScore: Math.round(averageScore)
  };
}

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env, params } = ctx;
  const type = STR(params?.type || '').toLowerCase();

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const auth = await parseAuthContext(request, env);
  if (!auth || auth.role !== 'student') {
    return apiError('Student role required', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const studentId = STR(auth.user?.studentId || parsed.searchParams.get('studentId'));
  const institutionId = STR(auth.user?.institutionId || parsed.searchParams.get('institutionId'));
  const limit = Number(parsed.searchParams.get('limit') || 100);
  const safeLimit = Math.min(Math.max(limit, 1), 500);

  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }

  if (!['summary', 'mistakes', 'history'].includes(type)) {
    return apiError('type must be one of summary|mistakes|history', 400, 400, ctx);
  }

  const tasks = await fetchReviewByStudent(env.DB, studentId, institutionId, safeLimit);
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  if (type === 'history') {
    return apiSuccess({
      type,
      studentId,
      items: safeTasks
    }, ctx);
  }

  if (type === 'mistakes') {
    return apiSuccess({
      type,
      studentId,
      items: safeTasks.filter((item) => Number(item.score || 0) < 70)
    }, ctx);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = await fetchStudentTasksByStudent(env.DB, studentId, institutionId, today);

  return apiSuccess({
    type,
    studentId,
    summary: toSummary(safeTasks),
    todayTasks: todayTasks || [],
    recent: safeTasks.slice(0, 8)
  }, ctx);
}
