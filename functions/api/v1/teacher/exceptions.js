import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../_shared/phase1Api.js';
import {
  fetchAttendanceByTeacher,
  upsertAttendance,
  fetchStudentById,
  ensureLessonAccountEnough,
  consumeLessonAccount,
  insertLesson,
  fetchStudentCourses,
  fetchCourseById,
  fetchLatestLessonAccountByStudent
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function normalizeStatus(value = '') {
  const v = `${value || ''}`.trim().toLowerCase();
  if (['attended', 'late', 'absent', 'leave'].includes(v)) {
    return v;
  }
  return 'absent';
}

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError(
      'D1 database not bound. Please configure wrangler d1_databases DB.',
      500,
      500,
      ctx
    );
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';
  if (!['teacher', 'founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method === 'GET') {
    const status = STR(parsed.searchParams.get('status'));
    const courseId = STR(parsed.searchParams.get('courseId'));
    const studentId = STR(parsed.searchParams.get('studentId'));
    const q = STR(parsed.searchParams.get('q'));

    const rows = await fetchAttendanceByTeacher(env.DB, institutionId, role === 'teacher' ? auth.user?.id : parsed.searchParams.get('teacherId') || '', {
      status,
      courseId,
      studentId,
      startAt: STR(parsed.searchParams.get('startAt')),
      endAt: STR(parsed.searchParams.get('endAt')),
      q: STR(parsed.searchParams.get('q'))
    });

    const source = Array.isArray(rows) ? rows : [];
    const filtered = source.filter((item) => {
      const text = `${item?.studentName || ''}${item?.courseName || ''}`.toLowerCase();
      return q ? text.includes(q.toLowerCase()) : true;
    });

    const page = filtered.slice(params.offset, params.offset + params.limit);
    return apiSuccess(
      {
        total: filtered.length,
        limit: params.limit,
        offset: params.offset,
        nextOffset: Math.min(filtered.length, params.offset + params.limit),
        exceptionCount: filtered.length,
        items: page
      },
      ctx
    );
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const payload = await request.json().catch(() => ({}));
  const studentId = STR(payload?.studentId);
  const courseId = STR(payload?.courseId);
  const status = normalizeStatus(payload?.status);
  const note = STR(payload?.note);

  if (!studentId || !courseId) {
    return apiError('studentId and courseId are required', 400, 400, ctx);
  }

  if (institutionId && studentId) {
    const student = await fetchStudentById(env.DB, institutionId, studentId);
    if (!student) {
      return apiError('student not found', 404, 404, ctx);
    }

    const course = await fetchCourseById(env.DB, courseId, institutionId);
    if (!course) {
      return apiError('course not found', 404, 404);
    }

    if (role === 'teacher' && STR(course.teacherId) !== STR(auth.user?.id)) {
      return apiError('No permission for this course', 403, 403, ctx);
    }

    const baseAttendance = await upsertAttendance(env.DB, {
      institutionId,
      courseId,
      studentId,
      teacherId: role === 'teacher' ? auth.user?.id : STR(payload?.teacherId),
      status,
      note,
      sourceLessonId: STR(payload?.sourceLessonId),
      attendedAt: STR(payload?.attendedAt)
    });

    const result = {
      attendance: baseAttendance,
      lesson: null,
      account: null,
      consumed: false,
      reason: null
    };

    if (['attended', 'late'].includes(status)) {
      const accountCheck = await ensureLessonAccountEnough(env.DB, studentId, 1);
      if (!accountCheck?.ok) {
        return apiSuccess({
          ...result,
          status,
          consumed: false,
          reason: `课时不足: ${accountCheck?.reason || 'NO_LESSON_ACCOUNT'}`,
          studentId,
          courseId
        }, ctx);
      }

      const createdLesson = await insertLesson(env.DB, {
        institutionId,
        studentId,
        teacherId: role === 'teacher' ? auth.user?.id : STR(course.teacherId),
        topic: course.name ? `课程点名-${course.name}` : '课程点名',
        status: status === 'late' ? 'late' : 'completed',
        hoursUsed: 1,
        teacherNote: note,
        parentFeedback: ''
      });

      const accountRow = await fetchLatestLessonAccountByStudent(env.DB, studentId);
      if (createdLesson && accountRow?.id) {
        await consumeLessonAccount(env.DB, studentId, accountRow.id, 1);
      }

      result.lesson = createdLesson;
      result.account = accountRow;
      result.consumed = true;
      result.reason = status === 'late' ? '迟到可保留课时或按机构规则扣课' : '已消课';
    }

    return apiSuccess(
      {
        status,
        studentId,
        courseId,
        attendance: baseAttendance,
        lesson: result.lesson,
        consumed: result.consumed,
        reason: result.reason,
        account: result.account
      },
      ctx
    );
  }

  return apiError('institutionId and studentId are required', 400, 400, ctx);
}
