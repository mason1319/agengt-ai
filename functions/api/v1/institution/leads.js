import {
  fetchLeadsByInstitution,
  insertLead,
  updateLead,
  fetchInstitutionById
} from '../_shared/dbLayer.js';
import { jsonResponse, parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value) => `${value || ''}`.trim();
const toNum = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function resolveInstitutionId(auth, request) {
  const url = request?.url || request;
  const parsed = new URL(`${url}`);
  return (
    STR(parsed.searchParams.get('institutionId'))
    || STR(auth?.user?.institutionId)
  );
}

function buildPagination(search) {
  const limit = toNum(search.get('limit'), 50);
  const offset = Math.max(0, toNum(search.get('offset'), 0));

  return {
    limit: Math.min(Math.max(limit, 1), 200),
    offset
  };
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

  const parsed = new URL(request.url);
  const institutionId = resolveInstitutionId(auth, request);
  if (!institutionId && ['platform', 'founder', 'teacher'].includes(role)) {
    return jsonResponse({ success: false, error: 'institutionId required' }, 400);
  }

  if (request.method === 'GET') {
    const { limit, offset } = buildPagination(parsed.searchParams);
    const filters = {
      institutionId,
      limit,
      offset,
      status: STR(parsed.searchParams.get('status')),
      q: STR(parsed.searchParams.get('q'))
    };

    if (role === 'teacher' && !auth?.user?.id) {
      return jsonResponse({ success: false, error: 'teacher identity required' }, 401);
    }

    if ((role === 'parent' || role === 'student') && role !== 'platform') {
      return jsonResponse({ success: false, error: 'No permission' }, 403);
    }

    const result = await fetchLeadsByInstitution(env.DB, filters);
    const items = Array.isArray(result?.items) ? result.items : [];

    return jsonResponse({
      success: true,
      total: result?.total || 0,
      data: {
        leads: items,
        limit,
        offset,
        nextOffset: result?.nextOffset || 0
      }
    });
  }

  if (!['platform', 'founder', 'teacher'].includes(role)) {
    return jsonResponse({ success: false, error: 'No permission' }, 403);
  }

  if (request.method === 'POST') {
    if (role === 'teacher' && !auth?.user?.id) {
      return jsonResponse({ success: false, error: 'teacher identity required' }, 401);
    }

    const payload = await request.json().catch(() => ({}));
    const guardianName = STR(payload.guardianName || payload.name);
    const studentGrade = STR(payload.studentGrade);
    const status = STR(payload.status || 'new');

    if (!guardianName) {
      return jsonResponse({ success: false, error: 'guardianName required' }, 400);
    }

    const inserted = await insertLead(env.DB, {
      institutionId,
      guardianName,
      studentGrade,
      needSummary: STR(payload.needSummary),
      status,
      aiRecommendation: STR(payload.aiRecommendation)
    });

    if (!inserted) {
      return jsonResponse({ success: false, error: 'Create lead failed' }, 500);
    }

    const details = await fetchLeadsByInstitution(env.DB, {
      institutionId,
      limit: 1,
      offset: 0,
      status: ''
    });

    return jsonResponse({
      success: true,
      data: {
        lead: inserted,
        leads: (Array.isArray(details?.items) ? details.items : []).filter((item) => item.id === inserted.id)
      }
    });
  }

  if (request.method === 'PATCH') {
    const payload = await request.json().catch(() => ({}));
    const leadId = STR(payload.id || parsed.searchParams.get('leadId'));
    if (!leadId) {
      return jsonResponse({ success: false, error: 'leadId required' }, 400);
    }

    const changes = {
      status: payload.status !== undefined ? STR(payload.status) : undefined,
      studentGrade: payload.studentGrade !== undefined ? STR(payload.studentGrade) : undefined,
      needSummary: payload.needSummary !== undefined ? STR(payload.needSummary) : undefined,
      aiRecommendation: payload.aiRecommendation !== undefined ? STR(payload.aiRecommendation) : undefined
    };

    const ok = await updateLead(env.DB, leadId, institutionId, changes);
    if (!ok) {
      return jsonResponse({ success: false, error: 'update failed' }, 500);
    }

    return jsonResponse({
      success: true,
      data: {
        leadId,
        updated: true
      }
    });
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
