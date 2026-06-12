import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../../_shared/phase1Api.js';
import {
  fetchTeacherAttendanceSheet,
  upsertAttendance,
  fetchCourseById,
  fetchCourseEnrollments,
  ensureLessonAccountEnough,
  consumeLessonAccount,
  insertLesson,
  fetchLatestLessonAccountByStudent
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function normalizeStatus(value = '') {
  const v = `${value || ''}`.trim().toLowerCase();
  if (['attended', 'late', 'absent', 'leave'].includes(v)) {
    return v;
  }
  return 'attended';
}

function parseStudentIdList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => STR(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => STR(item)).filter(Boolean);
  }

  return [];
}

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env, params } = ctx;
  const courseId = STR(params?.courseId);

  if (!courseId) {
    return apiError('courseId required', 400, 400, ctx);
  }

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';
  if (!['teacher', 'founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method === 'GET') {
    const course = await fetchCourseById(env.DB, courseId, institutionId);
    if (!course) {
      return apiError('course not found', 404, 404, ctx);
    }

    if (role === 'teacher' && STR(course.teacherId) !== STR(auth.user?.id)) {
      return apiError('No permission for this course', 403, 403, ctx);
    }

    const rows = await fetchTeacherAttendanceSheet(env.DB, courseId, institutionId);
    return apiSuccess({
      course,
      total: rows?.length || 0,
      items: rows || []
    }, ctx);
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const payload = await parseJsonBody(request);
  const status = normalizeStatus(payload?.status || 'attended');
  const note = STR(payload?.note);
  const studentIds = parseStudentIdList(payload?.studentIds);
  const explicitStudentId = STR(payload?.studentId);

  const course = await fetchCourseById(env.DB, courseId, institutionId);
  if (!course) {
    return apiError('course not found', 404, 404, ctx);
  }

  if (role === 'teacher' && STR(course.teacherId) !== STR(auth.user?.id)) {
    return apiError('No permission for this course', 403, 403, ctx);
  }

  let targets = studentIds;
  if (!targets.length && explicitStudentId) {
    targets = [explicitStudentId];
  }

  if (!targets.length) {
    const enrollments = await fetchCourseEnrollments(env.DB, courseId);
    targets = (Array.isArray(enrollments) ? enrollments : []).map((item) => STR(item.studentId)).filter(Boolean);
  }

  if (!targets.length) {
    return apiError('No target students', 400, 400, ctx);
  }

  const summary = {
    totalTargets: targets.length,
    success: 0,
    failed: 0,
    attendance: [],
    lessons: [],
    shortages: []
  };

  for (const studentId of targets) {
    const attendance = await upsertAttendance(env.DB, {
      institutionId,
      courseId,
      studentId,
      teacherId: role === 'teacher' ? auth.user?.id : STR(payload?.teacherId),
      status,
      note,
      sourceLessonId: STR(payload?.sourceLessonId),
      attendedAt: STR(payload?.attendedAt)
    });

    if (!attendance?.id) {
      summary.failed += 1;
      continue;
    }

    summary.success += 1;
    summary.attendance.push(attendance);

    if (['attended', 'late'].includes(status)) {
      const enough = await ensureLessonAccountEnough(env.DB, studentId, 1);
      if (!enough?.ok) {
        summary.shortages.push({ studentId, reason: `课时不足: ${enough?.reason || 'NO_LESSON_ACCOUNT'}` });
        continue;
      }

      const lesson = await insertLesson(env.DB, {
        institutionId,
        studentId,
        teacherId: role === 'teacher' ? auth.user?.id : STR(course.teacherId),
        topic: `一键消课-${course.name || '课程'}`,
        status: status === 'late' ? 'late' : 'completed',
        hoursUsed: 1,
        teacherNote: note,
        parentFeedback: ''
      });

      const account = await fetchLatestLessonAccountByStudent(env.DB, studentId);
      let deduction = {
        studentId,
        lesson,
        account,
        accountId: account?.id || '',
        hoursDeducted: 0,
        beforeRemaining: Number(account?.remaining_hours || account?.remainingHours || 0),
        afterRemaining: Number(account?.remaining_hours || account?.remainingHours || 0)
      };
      if (account?.id) {
        const consumedHours = await consumeLessonAccount(env.DB, studentId, account.id, 1);
        const updatedAccount = await fetchLatestLessonAccountByStudent(env.DB, studentId);
        deduction = {
          ...deduction,
          account: updatedAccount || account,
          hoursDeducted: Number(consumedHours || 0),
          afterRemaining: Number(updatedAccount?.remaining_hours || updatedAccount?.remainingHours || 0)
        };
      }

      summary.lessons.push(deduction);
    }
  }

  return apiSuccess(
    {
      courseId,
      status,
      summary
    },
    ctx
  );
}
