import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../_shared/phase1Api.js';
import { fetchStudentCourses } from '../_shared/dbLayer.js';
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
  const institutionId = STR(auth.user?.institutionId || parsed.searchParams.get('institutionId'));
  const studentId = STR(auth.user?.studentId || parsed.searchParams.get('studentId'));

  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }

  const rows = await fetchStudentCourses(env.DB, studentId, institutionId);
  return apiSuccess({ studentId, courses: rows || [] }, ctx);
}
