import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../../../_shared/phase1Api.js';
import {
  fetchStudentById,
  fetchLessons,
  fetchReviewByStudent,
  fetchStudentCourses,
  fetchStudentTasksByStudent
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function buildReviewStats(tasks = []) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const done = list.filter((item) => STR(item.status) === 'done').length;
  const average = total ? Math.round(list.reduce((acc, item) => acc + Number(item.score || 0), 0) / total) : 0;

  return {
    total,
    done,
    doneRate: total ? Math.round((done / total) * 100) : 0,
    averageScore: average
  };
}

function classifyTasks(tasks = []) {
  const list = Array.isArray(tasks) ? tasks : [];
  return {
    mistakes: list.filter((item) => Number(item.score || 0) < 70),
    latest: list.slice(0, 10),
    interventions: list.filter((item) => STR(item.taskType || item.task_type) === 'intervention')
  };
};

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
  if (!['teacher', 'founder', 'platform'].includes(STR(auth?.role))) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const studentId = STR(params?.studentId);
  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }

  const parsed = new URL(request.url);
  const { limit, offset } = parseLimitOffset(request);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));
  if (!institutionId && !['platform'].includes(auth?.role)) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, studentId);
  if (!student) {
    return apiError('student not found', 404, 404, ctx);
  }

  if (auth?.role === 'teacher' && STR(student.teacherId) !== STR(auth?.user?.id)) {
    return apiError('No permission for this student', 403, 403, ctx);
  }

  const [courses, lessons, reviewItems, todayTasks] = await Promise.all([
    fetchStudentCourses(env.DB, studentId, institutionId),
    fetchLessons(env.DB, {
      institutionId,
      studentId,
      limit: Math.min(Math.max(limit, 1), 200),
      offset
    }),
    fetchReviewByStudent(env.DB, studentId, institutionId, 100),
    fetchStudentTasksByStudent(env.DB, studentId, institutionId, new Date().toISOString().slice(0, 10))
  ]);

  const tasks = classifyTasks(Array.isArray(reviewItems) ? reviewItems : []);

  return apiSuccess(
    {
      student: {
        ...student,
        summary: buildReviewStats(Array.isArray(reviewItems) ? reviewItems : []),
        openRisk: STR(student?.renewalRisk || '') || null
      },
      courses: Array.isArray(courses) ? courses : [],
      lessonRecords: {
        list: Array.isArray(lessons?.items) ? lessons.items : [],
        total: Number(lessons?.total || 0),
        limit: Number(lessons?.limit || limit),
        offset: Number(lessons?.offset || offset),
        nextOffset: Number(lessons?.nextOffset || 0)
      },
      review: {
        total: tasks.latest.length,
        summary: buildReviewStats(Array.isArray(reviewItems) ? reviewItems : []),
        mistakes: tasks.mistakes,
        interventions: tasks.interventions,
        today: Array.isArray(todayTasks) ? todayTasks : [],
        recent: tasks.latest
      }
    },
    ctx
  );
}
