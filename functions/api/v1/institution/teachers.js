import {
  fetchInstitutionById,
  fetchTeachersByInstitution,
  fetchUserById
} from '../_shared/dbLayer.js';
import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';

const T = (value) => `${value || ''}`.trim();

function resolveInstitutionId(auth, url, explicit) {
  const parsed = new URL(url);
  const queryId = T(parsed.searchParams.get('institutionId'));
  return T(explicit) || queryId || T(auth?.user?.institutionId) || (auth?.role === 'platform' ? '' : 'inst-star');
}

function sanitizeTeacherPayload(payload = {}) {
  return {
    id: T(payload.id),
    username: T(payload.username || ''),
    password: payload.password ? `${payload.password}`.trim() : '',
    name: T(payload.name),
    phone: T(payload.phone),
    email: T(payload.email),
    status: payload.status ? `${payload.status}`.trim() : 'active',
    role: 'teacher'
  };
}

function buildPagination(query) {
  const limit = Number(query.get('limit') || 0);
  const offset = Number(query.get('offset') || 0);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';

  if (!['platform', 'founder', 'teacher'].includes(role)) {
    return jsonResponse({ success: false, error: 'No permission' }, 403);
  }

  if (!env?.DB) {
    return jsonResponse({
      success: false,
      error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
    }, 500);
  }

  const parsed = new URL(request.url);
  const institutionId = resolveInstitutionId(auth, request.url, parsed.searchParams.get('institutionId'));
  const limitOffset = buildPagination(parsed.searchParams);

  if (!institutionId && role !== 'platform') {
    return jsonResponse({ success: false, error: 'institutionId required' }, 400);
  }

  if (!institutionId && role === 'platform') {
    const platformMessage = 'platform role must pass institutionId';
    return jsonResponse({ success: false, error: platformMessage }, 400);
  }

  if (request.method === 'GET') {
    const rows = await fetchTeachersByInstitution(env.DB, institutionId, {
      limit: limitOffset.limit,
      offset: limitOffset.offset,
      status: T(parsed.searchParams.get('status')),
      q: T(parsed.searchParams.get('q'))
    });

    const items = Array.isArray(rows?.items) ? rows.items : [];
    const total = Number(rows?.total || items.length);

    return jsonResponse({
      success: true,
      total,
      data: {
        teachers: items,
        limit: limitOffset.limit,
        offset: limitOffset.offset,
        nextOffset: Math.min(total, limitOffset.offset + items.length)
      }
    });
  }

  if (request.method === 'POST') {
    if (!['platform', 'founder'].includes(role)) {
      return jsonResponse({ success: false, error: 'Only platform/founder can add teachers' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const username = T(payload.username);
    const password = `${payload.password || ''}`;
    const name = T(payload.name);

    if (!institutionId || !username || !password || !name) {
      return jsonResponse({
        success: false,
        error: 'institutionId, username, password, name are required'
      }, 400);
    }

    const existingRows = await fetchTeachersByInstitution(env.DB, institutionId, {
      limit: 200,
      offset: 0,
      q: username
    });
    const existing = Array.isArray(existingRows?.items)
      ? existingRows.items.find((user) => `${user.username || ''}` === username)
      : null;

    if (existing && existing.id) {
      return jsonResponse({ success: false, error: 'username already exists' }, 409);
    }

    const teacher = sanitizeTeacherPayload(payload);
    const teacherId = teacher.id || `u_teacher_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const institutionEntity = await fetchInstitutionById(env.DB, institutionId);
    if (!institutionEntity) {
      return jsonResponse({ success: false, error: 'institution not found' }, 404);
    }

    await env.DB.prepare(
      `INSERT INTO users (id, institution_id, role, username, password_hash, name, phone, email, status)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(
      teacherId,
      institutionId,
      teacher.role,
      teacher.username,
      password,
      teacher.name,
      teacher.phone,
      teacher.email,
      teacher.status
    ).run();

    const teachers = await fetchTeachersByInstitution(env.DB, institutionId, {
      limit: limitOffset.limit,
      offset: limitOffset.offset
    });

    return jsonResponse({
      success: true,
      data: {
        teacherId,
        teachers: Array.isArray(teachers?.items) ? teachers.items : []
      }
    });
  }

  if (request.method === 'PATCH') {
    if (!['platform', 'founder'].includes(role)) {
      return jsonResponse({ success: false, error: 'Only platform/founder can update teachers' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const teacherId = T(payload.id || parsed.searchParams.get('id'));
    if (!teacherId) {
      return jsonResponse({ success: false, error: 'teacher id required' }, 400);
    }

    const teacher = await fetchUserById(env.DB, teacherId, institutionId);
    if (!teacher || teacher.role !== 'teacher') {
      return jsonResponse({ success: false, error: 'teacher not found' }, 404);
    }

    const fields = [];
    const values = [teacherId, institutionId];
    let idx = 3;

    if (payload.status !== undefined) {
      values.push(`${payload.status || ''}`.trim() || 'active');
      fields.push(`status = ?${idx}`);
      idx += 1;
    }

    if (payload.phone !== undefined) {
      values.push(`${payload.phone || ''}`.trim());
      fields.push(`phone = ?${idx}`);
      idx += 1;
    }

    if (payload.email !== undefined) {
      values.push(`${payload.email || ''}`.trim());
      fields.push(`email = ?${idx}`);
      idx += 1;
    }

    if (payload.name !== undefined) {
      values.push(`${payload.name || ''}`.trim());
      fields.push(`name = ?${idx}`);
      idx += 1;
    }

    if (!fields.length) {
      return jsonResponse({ success: false, error: 'No valid fields' }, 400);
    }

    const row = await env.DB.prepare(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?1 AND institution_id = ?2`
    ).bind(...values).run();

    if (!row?.meta?.changes) {
      return jsonResponse({ success: false, error: 'update failed' }, 500);
    }

    const next = await fetchUserById(env.DB, teacherId, institutionId);

    return jsonResponse({
      success: true,
      data: {
        teacher: next || null
      }
    });
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
