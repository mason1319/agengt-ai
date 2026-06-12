import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../../../_shared/phase1Api.js';
import {
  fetchStudentById,
  fetchParentChildren,
  fetchLessonAccountsByInstitution,
  fetchPaymentRecordsByInstitution,
  fetchStudentCourses,
  fetchReviewByStudent,
  fetchStudentTasksByStudent,
  fetchLessons
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function calculateSummary(tasks = []) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const done = list.filter((item) => STR(item.status) === 'done').length;
  const average = total
    ? Math.round(list.reduce((acc, item) => acc + Number(item.score || 0), 0) / total)
    : 0;

  return {
    totalTasks: total,
    doneTasks: done,
    doneRate: total ? Math.round((done / total) * 100) : 0,
    averageScore: average
  };
}

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
  const currentRole = auth?.role;
  const tokenChildId = STR(auth?.user?.childId);
  const parentId = STR(auth?.user?.id);

  if (!institutionId && ['parent'].includes(currentRole)) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (currentRole === 'parent') {
    const children = await fetchParentChildren(env.DB, institutionId, parentId, 1000);
    const isAllowed = (children || []).some((item) => STR(item.studentId) === childId);
    if (!isAllowed && !(tokenChildId && tokenChildId === childId)) {
      return apiError('No permission for this child', 403, 403, ctx);
    }
  }

  const student = await fetchStudentById(env.DB, institutionId, childId);
  if (!student) {
    return apiError('child not found', 404, 404, ctx);
  }

  const courses = await fetchStudentCourses(env.DB, childId, institutionId);
  const accounts = (await fetchLessonAccountsByInstitution(env.DB, institutionId)).filter((row) => STR(row.student_id) === childId);
  const payments = await fetchPaymentRecordsByInstitution(env.DB, { institutionId, studentId: childId });
  const tasks = await fetchReviewByStudent(env.DB, childId, institutionId, 50);
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = await fetchStudentTasksByStudent(env.DB, childId, institutionId, today);
  const lessons = await fetchLessons(env.DB, { institutionId, studentId: childId, limit: 10 });
  const lessonFeedback = (lessons?.items || [])
    .filter((lesson) => STR(lesson.parentFeedback))
    .slice(0, 5)
    .map((lesson) => ({
      id: lesson.id,
      lessonId: lesson.id,
      topic: lesson.topic || '',
      teacherName: lesson.teacherName || '',
      feedback: lesson.parentFeedback || '',
      parentFeedback: lesson.parentFeedback || '',
      createdAt: lesson.createdAt || ''
    }));

  return apiSuccess(
    {
      student,
      summary: calculateSummary(tasks || []),
      courses: courses || [],
      lessonAccounts: accounts || [],
      paymentRecords: payments || [],
      todayTasks: todayTasks || [],
      lessonFeedback,
      recentFeedback: lessonFeedback,
      recent: (tasks || []).slice(0, 10)
    },
    ctx
  );
}
