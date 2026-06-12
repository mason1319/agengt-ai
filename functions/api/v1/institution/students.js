import {
  fetchInstitutionById,
  fetchStudentById,
  fetchStudentsByInstitution,
  fetchStudentsByTeacher,
  insertStudent,
  updateStudent
} from '../_shared/dbLayer.js';
import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';

const EMPTY = (value) => `${value || ''}`.trim();

function resolveInstitutionFromAuth(auth, url, explicit) {
  const parsed = new URL(url);
  const institutionFromQuery = EMPTY(parsed.searchParams.get('institutionId'));
  const explicitInst = EMPTY(explicit);

  if (explicitInst) {
    return explicitInst;
  }

  if (institutionFromQuery) {
    return institutionFromQuery;
  }

  const demoInstitution = EMPTY(auth?.user?.institutionId);
  if (demoInstitution) {
    return demoInstitution;
  }

  if (auth?.role === 'founder' || auth?.role === 'platform' || auth?.role === 'teacher') {
    return auth?.user?.institutionId || 'inst-star';
  }

  return '';
}

function enforceRoleInBody(role, body = {}) {
  const payload = { ...body };

  if (role === 'teacher') {
    const allow = ['weaknessPoints', 'renewalRisk'];
    const hasOnlyAllowed = Object.keys(payload).every((k) => allow.includes(k));

    if (!hasOnlyAllowed) {
      return false;
    }
  }

  return true;
}

function maskContactForRole(value = '') {
  const text = `${value || ''}`.trim();
  if (!text) {
    return '已脱敏';
  }

  if (text.includes('***')) {
    return text;
  }

  if (text.length <= 8) {
    return '****';
  }

  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function projectStudentForRole(student, role = '') {
  if (!student || typeof student !== 'object') {
    return student;
  }

  if (role !== 'teacher') {
    return student;
  }

  if (!student.parent) {
    return student;
  }

  return {
    ...student,
    parent: {
      ...student.parent,
      name: student.parent.name || '已脱敏',
      phoneMasked: maskContactForRole(student.parent.phoneMasked),
      wechatMasked: student.parent.wechatMasked ? '已脱敏' : '已脱敏'
    }
  };
}

function projectStudentsForRole(students = [], role = '') {
  return (Array.isArray(students) ? students : []).map((item) => projectStudentForRole(item, role));
}

function sanitizeStudentPayload(payload = {}, institutionId) {
  const input = payload || {};
  return {
    id: EMPTY(input.id),
    institutionId: EMPTY(institutionId),
    name: EMPTY(input.name),
    grade: EMPTY(input.grade),
    guardianId: EMPTY(input.guardianId),
    guardianName: EMPTY(input.guardianName),
    guardianPhone: `${input.guardianPhone || ''}`.trim(),
    guardianWechat: `${input.guardianWechat || ''}`.trim(),
    teacherId: EMPTY(input.teacherId),
    weaknessPoints: `${input.weaknessPoints || ''}`.trim(),
    renewalRisk: Number(input.renewalRisk)
  };
}

async function isTeacherAssignedToStudent(db, institutionId, teacherId, studentId) {
  if (!teacherId || !studentId || !institutionId) {
    return false;
  }

  const student = await fetchStudentById(db, institutionId, studentId);
  return !!student && EMPTY(student.teacherId) === EMPTY(teacherId);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';

  if (!env?.DB && request.method !== 'GET') {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const query = new URL(request.url);
  const parsedLimit = Number(query.searchParams.get('limit') || 0);
  const parsedOffset = Number(query.searchParams.get('offset') || 0);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;
  const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
  const institutionId = resolveInstitutionFromAuth(auth, request.url, query.searchParams.get('institutionId'));

  if ((role === 'platform' || role === 'founder' || role === 'teacher') && !institutionId) {
    return jsonResponse({ success: false, error: 'institutionId is required' }, 400);
  }

  if (request.method === 'GET') {
    if (role === 'teacher' && !auth?.user?.id) {
      return jsonResponse({ success: false, error: 'teacher user required' }, 401);
    }

    if (role === 'parent' || role === 'student') {
      const targetId = EMPTY(auth?.user?.childId || auth?.user?.studentId);
      if (!targetId) {
        return jsonResponse({ success: false, error: 'current user has no bound student' }, 400);
      }

      const student = await fetchStudentById(env.DB, institutionId || auth?.user?.institutionId, targetId);
      if (!student) {
        return jsonResponse({ success: false, error: 'student not found' }, 404);
      }

      return jsonResponse({
        success: true,
        total: 1,
        data: {
          students: [projectStudentForRole(student, role)],
          total: 1,
          limit: 1,
          offset: 0,
          nextOffset: 0
        }
      });
    }

    const explicitStudentId = EMPTY(query.searchParams.get('studentId'));
    if (explicitStudentId) {
      const student = await fetchStudentById(env.DB, institutionId, explicitStudentId);
      if (!student) {
        return jsonResponse({ success: false, error: 'student not found' }, 404);
      }

      if (role === 'teacher' && student.teacherId && student.teacherId !== auth?.user?.id) {
        return jsonResponse({ success: false, error: 'No permission for this student' }, 403);
      }

      return jsonResponse({
        success: true,
        data: {
          students: [projectStudentForRole(student, role)],
          total: 1,
          limit: 1,
          offset: 0,
          nextOffset: 0
        }
      });
    }

    const basePayload = {
      institutionId,
      limit,
      offset,
      q: EMPTY(query.searchParams.get('q'))
    };

    if (role === 'teacher') {
      const teacherStudents = await fetchStudentsByTeacher(
        env.DB,
        institutionId,
        auth?.user?.id,
        limit
      );
      const items = Array.isArray(teacherStudents) ? teacherStudents : [];
      return jsonResponse({
        success: true,
        total: items.length,
        data: {
          students: projectStudentsForRole(items, role),
          limit,
          offset,
          nextOffset: offset + limit
        }
      });
    }

    const rows = await fetchStudentsByInstitution(
      env.DB,
      institutionId,
      limit
    );

    const filtered = basePayload.q
      ? (Array.isArray(rows) ? rows : []).filter((item) => {
          const text = `${item?.name || ''}${item?.grade || ''}${item?.id || ''}`.toLowerCase();
          return text.includes(basePayload.q.toLowerCase());
        })
      : rows || [];

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);
    const institution = await fetchInstitutionById(env.DB, institutionId);

      return jsonResponse({
        success: true,
        institution: institution || null,
        total,
        data: {
          students: projectStudentsForRole(page, role),
          limit,
          offset,
          nextOffset: offset + page.length
        }
      });
  }

  if (!auth || !auth.user?.id && role === 'platform') {
    // preserve compatibility with static demo token in demo mode
  }

  if (request.method === 'POST') {
    if (!['platform', 'founder', 'teacher'].includes(role)) {
      return jsonResponse({ success: false, error: 'No permission to add students' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const payloadInstitution = resolveInstitutionFromAuth(auth, request.url, payload?.institutionId);
    if (!payloadInstitution) {
      return jsonResponse({ success: false, error: 'institutionId is required' }, 400);
    }

    if (role === 'teacher' && payload?.teacherId && EMPTY(payload.teacherId) !== EMPTY(auth.user?.id)) {
      return jsonResponse({ success: false, error: 'Teacher can only create records for themselves' }, 403);
    }

    const inserted = await insertStudent(
      env.DB,
      {
        ...sanitizeStudentPayload(payload, payloadInstitution),
        teacherId: role === 'teacher' ? auth?.user?.id : sanitizeStudentPayload(payload, payloadInstitution).teacherId
      }
    );

    if (!inserted) {
      return jsonResponse({ success: false, error: 'Create student failed' }, 500);
    }

    const student = await fetchStudentById(env.DB, payloadInstitution, inserted.id);
    return jsonResponse({
      success: true,
      data: {
        student: projectStudentForRole(student, role)
      }
    });
  }

  if (request.method === 'PATCH') {
    const payload = await request.json().catch(() => ({}));
    const studentId = EMPTY(payload.id || query.searchParams.get('studentId'));

    if (!studentId) {
      return jsonResponse({ success: false, error: 'studentId is required' }, 400);
    }

    if (!['platform', 'founder', 'teacher'].includes(role)) {
      return jsonResponse({ success: false, error: 'No permission to update students' }, 403);
    }

    if (!institutionId) {
      return jsonResponse({ success: false, error: 'institutionId is required' }, 400);
    }

    if (role === 'teacher' && !enforceRoleInBody('teacher', payload)) {
      return jsonResponse({ success: false, error: 'Teacher cannot edit requested fields' }, 403);
    }

    if (role === 'teacher') {
      const assigned = await isTeacherAssignedToStudent(env.DB, institutionId, auth?.user?.id, studentId);
      if (!assigned) {
        return jsonResponse({ success: false, error: 'No permission for this student' }, 403);
      }
    }

    const normalized = {
      weaknessPoints: payload.weaknessPoints !== undefined ? `${payload.weaknessPoints || ''}`.trim() : undefined,
      renewalRisk: payload.renewalRisk !== undefined ? Number(payload.renewalRisk) : undefined,
      name: payload.name !== undefined ? `${payload.name || ''}`.trim() : undefined,
      grade: payload.grade !== undefined ? `${payload.grade || ''}`.trim() : undefined,
      teacherId: payload.teacherId !== undefined ? `${payload.teacherId || ''}`.trim() || null : undefined
    };

    if (role === 'teacher' && Object.keys(normalized).every((k) => normalized[k] === undefined)) {
      return jsonResponse({ success: false, error: 'No updatable fields' }, 400);
    }

    const next = await updateStudent(env.DB, institutionId, studentId, normalized);
    if (!next) {
      return jsonResponse({ success: false, error: 'Update failed or no changes' }, 400);
    }

    const student = await fetchStudentById(env.DB, institutionId, studentId);
    return jsonResponse({
      success: true,
      data: {
        student: projectStudentForRole(student, role)
      }
    });
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
