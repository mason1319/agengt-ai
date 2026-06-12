import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset
} from '../_shared/phase1Api.js';
import {
  fetchStudentsByTeacher,
  fetchStudentsByInstitution,
  fetchStudentById
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function projectParentForTeacher(student = {}) {
  if (!student || typeof student !== 'object') {
    return student;
  }

  return {
    ...student,
    parent: student.parent
      ? {
          ...student.parent,
          name: student.parent.name || '已脱敏',
          phoneMasked: student.parent.phoneMasked ? '已脱敏' : '已脱敏',
          wechatMasked: student.parent.wechatMasked ? '已脱敏' : '已脱敏'
        }
      : undefined
  };
}

function getInstitutionId(auth, requestUrl) {
  const parsed = new URL(requestUrl);
  return STR(auth?.user?.institutionId || parsed.searchParams.get('institutionId'));
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
  if (!auth?.user?.id && auth?.role !== 'platform') {
    return apiError('Authentication required', 401, 401, ctx);
  }

  if (!['teacher', 'founder', 'platform'].includes(auth.role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const params = parseLimitOffset(request);
  const institutionId = getInstitutionId(auth, request.url);

  if (!institutionId && !['platform'].includes(auth.role)) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const q = STR(parsed.searchParams.get('q'));
  const status = STR(parsed.searchParams.get('status'));

  if (auth.role === 'teacher') {
    const students = await fetchStudentsByTeacher(env.DB, institutionId, auth.user?.id, params.limit);

    const filtered = q || status
      ? (Array.isArray(students) ? students : []).filter((item) => {
          const text = `${item?.name || ''}${item?.grade || ''}${item?.id || ''}`.toLowerCase();
          const matchesQ = q ? text.includes(q.toLowerCase()) : true;
          const matchesStatus = status ? ((item?.status || 'active') === status) : true;
          return matchesQ && matchesStatus;
        })
      : (students || []);

    const page = filtered.slice(
      Number.isFinite(params.offset) ? params.offset : 0,
      (Number.isFinite(params.offset) ? params.offset : 0) + (Number.isFinite(params.limit) ? params.limit : 50)
    );

    return apiSuccess(
      {
        institutionId,
        scope: 'teacher',
        total: filtered.length,
        limit: params.limit,
        offset: params.offset,
        nextOffset: Math.min(filtered.length, params.offset + params.limit),
        students: page.map((item) => projectParentForTeacher(item))
      },
      ctx
    );
  }

  const students = await fetchStudentsByInstitution(env.DB, institutionId, params.limit);
  const filtered = q || status
    ? (Array.isArray(students) ? students : []).filter((item) => {
        const text = `${item?.name || ''}${item?.grade || ''}${item?.id || ''}`.toLowerCase();
        const matchesQ = q ? text.includes(q.toLowerCase()) : true;
        const matchesStatus = status ? ((item?.status || 'active') === status) : true;
        return matchesQ && matchesStatus;
      })
    : (students || []);

  const page = filtered.slice(params.offset, params.offset + params.limit);
  return apiSuccess(
    {
      institutionId,
      scope: 'founder',
      total: filtered.length,
      limit: params.limit,
      offset: params.offset,
      nextOffset: Math.min(filtered.length, params.offset + params.limit),
      students: page
    },
    ctx
  );
}
