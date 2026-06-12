import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset,
  parseJsonBody
} from '../_shared/phase1Api.js';
import {
  fetchCourses,
  insertCourse,
  updateCourse,
  fetchCourseById
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

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

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && auth.role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method === 'GET') {
    const rows = await fetchCourses(env.DB, {
      institutionId,
      limit: params.limit,
      offset: params.offset,
      grade: STR(parsed.searchParams.get('grade')),
      status: STR(parsed.searchParams.get('status')),
      classType: STR(parsed.searchParams.get('classType'))
    });

    return apiSuccess(
      {
        institutionId,
        total: rows?.total || 0,
        limit: rows?.limit || params.limit,
        offset: rows?.offset || params.offset,
        nextOffset: rows?.nextOffset || 0,
        courses: rows?.items || []
      },
      ctx
    );
  }

  if (request.method === 'POST') {
    const payload = await parseJsonBody(request);
    if (!payload?.name) {
      return apiError('name is required', 400, 400, ctx);
    }

    const inserted = await insertCourse(env.DB, {
      institutionId,
      teacherId: STR(payload.teacherId),
      name: STR(payload.name),
      grade: STR(payload.grade),
      level: STR(payload.level),
      classType: STR(payload.classType || payload.class_type),
      schedule: STR(payload.schedule),
      startTime: STR(payload.startTime || payload.start_time),
      durationMinutes: Number(payload.durationMinutes || payload.duration_minutes || 90),
      capacity: Number(payload.capacity || 12),
      priceCents: Number(payload.priceCents || payload.price_cents || 0),
      status: STR(payload.status || 'active'),
      imageUrl: STR(payload.imageUrl || payload.image_url)
    });

    if (!inserted?.id) {
      return apiError('Create course failed', 500, 500, ctx);
    }

    const course = await fetchCourseById(env.DB, inserted.id, institutionId);
    return apiSuccess({
      created: true,
      course
    }, ctx);
  }

  if (request.method === 'PATCH') {
    const payload = await parseJsonBody(request);
    const courseId = STR(payload.id || parsed.searchParams.get('courseId'));
    if (!courseId) {
      return apiError('courseId required', 400, 400, ctx);
    }

    const fields = {
      name: STR(payload.name),
      grade: STR(payload.grade),
      level: STR(payload.level),
      classType: STR(payload.classType || payload.class_type),
      schedule: STR(payload.schedule),
      startTime: STR(payload.startTime || payload.start_time),
      priceCents: Number(payload.priceCents || payload.price_cents || 0),
      capacity: Number(payload.capacity || 0),
      status: STR(payload.status)
    };

    const ok = await updateCourse(env.DB, courseId, institutionId, fields);
    if (!ok) {
      return apiError('Update course failed', 500, 500, ctx);
    }

    const course = await fetchCourseById(env.DB, courseId, institutionId);
    return apiSuccess({
      updated: true,
      course
    }, ctx);
  }

  return apiError('Method Not Allowed', 405, 405, ctx);
}
