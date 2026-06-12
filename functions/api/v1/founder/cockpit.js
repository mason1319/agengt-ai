import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../_shared/phase1Api.js';
import {
  fetchInstitutionById,
  fetchStudentsByInstitution,
  fetchCourses,
  fetchLeadsByInstitution,
  fetchLeadsByQuery,
  fetchPaymentRecordsByInstitution,
  fetchLessonAccountsByInstitution,
  fetchFounderAttendanceRecords,
  fetchAiUsageSummary
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function countByStatus(rows = [], field = 'status') {
  return rows.reduce((acc, item) => {
    const key = STR(item?.[field]);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sumByField(rows = [], field = 'remaining_hours') {
  return rows.reduce((acc, item) => acc + Number(item?.[field] || 0), 0);
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

  const auth = await parseAuthContext(request, env);
  if (!['founder', 'platform'].includes(auth?.role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && auth.role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const institution = await fetchInstitutionById(env.DB, institutionId);
  const students = (await fetchStudentsByInstitution(env.DB, institutionId, 1000)) || [];
  const courses = (await fetchCourses(env.DB, {
    institutionId,
    status: STR(parsed.searchParams.get('courseStatus')) || 'active',
    limit: 200,
    offset: 0
  })) || [];
  const leads = (await fetchLeadsByInstitution(env.DB, {
    institutionId,
    status: STR(parsed.searchParams.get('leadStatus')), 
    limit: 200,
    offset: 0
  })) || [];
  const leadAll = (await fetchLeadsByQuery(env.DB, { institutionId })) || [];
  const paymentRecords = (await fetchPaymentRecordsByInstitution(env.DB, {
    institutionId,
    status: STR(parsed.searchParams.get('paymentStatus'))
  })) || [];
  const lessonAccounts = (await fetchLessonAccountsByInstitution(env.DB, institutionId)) || [];
  const attendance = (await fetchFounderAttendanceRecords(env.DB, institutionId, {
    startAt: STR(parsed.searchParams.get('startAt')),
    endAt: STR(parsed.searchParams.get('endAt'))
  })) || [];
  const aiUsageArr = (await fetchAiUsageSummary(env.DB, {
    institutionId,
    startAt: STR(parsed.searchParams.get('aiStartAt')),
    endAt: STR(parsed.searchParams.get('aiEndAt'))
  })) || [];

  const aiUsage = Array.isArray(aiUsageArr) && aiUsageArr.length ? aiUsageArr[0] : null;

  return apiSuccess(
    {
      institution,
      studentsCount: students.length,
      students,
      coursesCount: courses?.total || 0,
      courses: courses?.items || [],
      leadsCount: (leads?.items || []).length,
      leadsByStatus: countByStatus(leads?.items || [], 'status'),
      leadsTotal: leadAll.length,
      leadsAll: leadAll,
      attendanceCount: attendance.length,
      attendanceByStatus: countByStatus(attendance, 'status'),
      lessonAccountSummary: {
        totalStudents: new Set((Array.isArray(lessonAccounts) ? lessonAccounts : []).map((item) => `${item.student_id || ''}`)).size,
        totalPurchased: sumByField(lessonAccounts, 'purchased_hours'),
        totalRemaining: sumByField(lessonAccounts, 'remaining_hours')
      },
      paymentRecords: {
        total: paymentRecords.length,
        byStatus: countByStatus(paymentRecords, 'status')
      },
      aiUsage: aiUsage || null,
      cockpitAt: new Date().toISOString()
    },
    ctx
  );
}
