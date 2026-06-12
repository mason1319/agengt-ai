import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../../_shared/phase1Api.js';
import { fetchCourseEnrollments } from '../../_shared/dbLayer.js';
import { parseAuthContext } from '../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function normalizeCourseRow(row = {}) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  return {
    id: row.id,
    name: STR(row.name),
    grade: STR(row.grade),
    level: row.level,
    classType: STR(row.class_type || row.classType || ''),
    courseType: STR(row.course_type || row.courseType || ''),
    schedule: STR(row.schedule || ''),
    startDate: STR(row.start_date || ''),
    endDate: STR(row.end_date || ''),
    weekday: STR(row.weekday || ''),
    timeSlot: STR(row.time_slot || ''),
    startTime: STR(row.start_time || row.startTime || ''),
    durationMinutes: Number(row.duration_minutes || row.durationMinutes || 0),
    totalSessions: Number(row.total_sessions || row.totalSessions || 0),
    sessionDuration: Number(row.session_duration || row.sessionDuration || 0),
    capacity: Number(row.capacity || 0),
    remainingSeats: Number(
      row.remaining_seats || Math.max(0, Number(row.capacity || 0) - Number(row.enrolled_count || 0))
    ),
    enrolledCount: Number(row.enrolled_count || 0),
    priceCents: Number(row.price_cents || row.priceCents || 0),
    singlePeriodPrice: Number(row.single_period_price || 0),
    bundlePrice: Number(row.bundle_price || 0),
    currency: STR(row.currency || 'CNY'),
    status: STR(row.status || 'active'),
    teacherId: STR(row.teacher_id || row.teacherId || ''),
    teacherName: STR(row.teacher_name || row.teacherName || ''),
    imageUrl: STR(row.image_url || ''),
    classroom: STR(row.classroom || ''),
    createdAt: STR(row.created_at || '')
  };
}

function buildCourseDetail(course, enrollments = [], institutionId = '', auth) {
  const safeAuthRole = STR(auth?.role || '').toLowerCase();
  const canSeePrivate = ['founder', 'teacher', 'platform'].includes(safeAuthRole);
  const isOwnerInstitution = safeAuthRole
    ? canSeePrivate || STR(auth?.user?.institutionId) === STR(institutionId)
    : false;
  const hideStudentList = !isOwnerInstitution;

  const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
  const limitedStudents = hideStudentList ? [] : safeEnrollments.slice(0, 20).map((item) => ({
    studentId: STR(item.studentId || item.student_id),
    status: STR(item.enrollment_status || item.status || 'active'),
    enrolledAt: STR(item.enrolledAt || item.created_at || '')
  }));

  return {
    course: {
      ...course,
      institutionId: STR(course?.institutionId || course?.institution_id || institutionId),
      visibleToPublic: true,
      enrollmentLimit: course?.capacity || 0,
      remainingSeats: Math.max(course?.remainingSeats || 0, 0),
      openForTrial: course?.status !== 'closed'
    },
    enrollments: {
      total: safeEnrollments.length,
      list: limitedStudents
    }
  };
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

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const courseId = STR(params?.id);
  if (!courseId) {
    return apiError('course id required', 400, 400, ctx);
  }

  const auth = await parseAuthContext(request, env, { allowRoleHint: true });
  const parsed = new URL(request.url);
  const queryInstitution = STR(parsed.searchParams.get('institutionId'));
  const institutionId = STR(queryInstitution || auth?.user?.institutionId);

  const row = await env.DB
    .prepare(
      `SELECT
         c.id, c.institution_id, c.teacher_id, u.name AS teacher_name,
         c.name, c.grade, c.level, c.class_type, c.course_type, c.start_date, c.end_date,
         c.weekday, c.time_slot, c.schedule, c.start_time, c.duration_minutes,
         c.total_sessions, c.session_duration, c.capacity, c.enrolled_count, c.price_cents,
         c.single_period_price, c.bundle_price, c.classroom, c.status, c.image_url, c.created_at
       FROM courses c
       LEFT JOIN users u ON u.id = c.teacher_id
       WHERE c.id = ?1 ${queryInstitution ? 'AND c.institution_id = ?2' : ''}
       LIMIT 1`
    )
    .bind(...(queryInstitution ? [courseId, queryInstitution] : [courseId]))
    .first();

  if (!row?.id) {
    return apiError('course not found', 404, 404, ctx);
  }

  const normalized = normalizeCourseRow(row);
  const enrollments = await fetchCourseEnrollments(env.DB, courseId);
  const data = buildCourseDetail(normalized, enrollments || [], institutionId, auth);

  return apiSuccess(data, ctx);
}
