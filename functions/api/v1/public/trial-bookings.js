import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../_shared/phase1Api.js';
import { createTrialBooking, fetchCourseById, fetchLeadMessages } from '../_shared/dbLayer.js';

const STR = (value = '') => `${value || ''}`.trim();

const summarizeCourse = (course = {}) => ({
  id: STR(course.id),
  institutionId: STR(course.institutionId),
  name: STR(course.name),
  title: STR(course.name),
  grade: STR(course.grade),
  level: STR(course.level),
  classType: STR(course.classType),
  schedule: STR(course.schedule),
  startTime: STR(course.startTime),
  durationMinutes: Number(course.durationMinutes || 0),
  priceCents: Number(course.priceCents || 0),
  currency: STR(course.currency || 'CNY')
});

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const payload = await parseJsonBody(request);
  const leadId = STR(payload?.leadId);
  const institutionId = STR(payload?.institutionId);
  const courseId = STR(payload?.courseId);
  const teacherId = STR(payload?.teacherId);
  const reservedAt = STR(payload?.reservedAt);

  if (!leadId || !institutionId || !courseId || !reservedAt) {
    return apiError('leadId, institutionId, courseId, reservedAt required', 400, 400, ctx);
  }

  const course = await fetchCourseById(env.DB, courseId, institutionId);
  if (!course?.id) {
    return apiError('course not found', 404, 404, ctx);
  }

  const booking = await createTrialBooking(env.DB, {
    leadId,
    institutionId,
    courseId,
    teacherId,
    reservedAt,
    durationMinutes: Number(payload?.durationMinutes || 60),
    sourceChannel: STR(payload?.sourceChannel || 'web'),
    notes: STR(payload?.notes),
    status: STR(payload?.status || 'pending')
  });

  if (!booking) {
    return apiError('Create trial booking failed', 500, 500, ctx);
  }

  await fetchLeadMessages(env.DB, leadId);

  return apiSuccess({
    booking,
    leadId,
    status: 'pending',
    courseSummary: summarizeCourse(course)
  }, ctx);
}
