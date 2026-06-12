import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../_shared/phase1Api.js';
import {
  fetchCourses,
  fetchCoursesByTeacher
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
  const role = auth?.role || 'founder';
  if (!['teacher', 'founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);
  const institutionId = STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const grade = STR(parsed.searchParams.get('grade'));
  const status = STR(parsed.searchParams.get('status'));
  const classType = STR(parsed.searchParams.get('classType'));

  if (role === 'teacher') {
    const items = await fetchCoursesByTeacher(env.DB, auth.user?.id || '', institutionId);
    const filtered = (Array.isArray(items) ? items : []).filter((course) => {
      const matchGrade = grade ? STR(course.grade) === grade : true;
      const matchStatus = status ? STR(course.status) === status : true;
      const matchClass = classType ? STR(course.classType || course.class_type) === classType : true;
      return matchGrade && matchStatus && matchClass;
    });

    const list = filtered.slice(params.offset, params.offset + params.limit);

    return apiSuccess({
      role: 'teacher',
      institutionId,
      limit: params.limit,
      offset: params.offset,
      nextOffset: Math.min(filtered.length, params.offset + params.limit),
      total: filtered.length,
      courses: list
    }, ctx);
  }

  const result = await fetchCourses(env.DB, {
    institutionId,
    limit: params.limit,
    offset: params.offset,
    grade,
    status: status || 'active',
    classType
  });

  return apiSuccess({
    role,
    institutionId,
    total: result?.total || 0,
    limit: Number(result?.limit || params.limit),
    offset: Number(result?.offset || params.offset),
    nextOffset: Number(result?.nextOffset || 0),
    courses: result?.items || []
  }, ctx);
}
