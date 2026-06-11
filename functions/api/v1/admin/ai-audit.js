import {
  fetchAiAuditLogs,
  fetchAiAuditSourceSummary
} from '../_shared/dbLayer.js';
import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';

function parseLimitParam(value, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(Math.floor(parsed), 200));
}

function parseOffsetParam(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
}

function parseFilters(url) {
  return {
    institutionId: `${url.searchParams.get('institutionId') || ''}`.trim(),
    role: `${url.searchParams.get('role') || ''}`.trim(),
    action: `${url.searchParams.get('action') || ''}`.trim(),
    decision: `${url.searchParams.get('decision') || ''}`.trim(),
    userId: `${url.searchParams.get('userId') || ''}`.trim(),
    clientIp: `${url.searchParams.get('clientIp') || ''}`.trim(),
    startAt: `${url.searchParams.get('startAt') || ''}`.trim(),
    endAt: `${url.searchParams.get('endAt') || ''}`.trim(),
    limit: parseLimitParam(url.searchParams.get('limit'), 50),
    offset: parseOffsetParam(url.searchParams.get('offset'))
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const auth = await parseAuthContext(request, env);
  if (!auth || auth.role !== 'platform') {
    return jsonResponse({ success: false, error: 'Platform role required' }, 403);
  }

  if (!env?.DB) {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const url = new URL(request.url);
  const filters = parseFilters(url);
  const rows = await fetchAiAuditLogs(env.DB, {
    institutionId: filters.institutionId,
    role: filters.role,
    action: filters.action,
    decision: filters.decision,
    userId: filters.userId,
    clientIp: filters.clientIp,
    startAt: filters.startAt,
    endAt: filters.endAt,
    limit: filters.limit,
    offset: filters.offset
  });
  const sourceSummary = await fetchAiAuditSourceSummary(env.DB, {
    institutionId: filters.institutionId,
    role: filters.role,
    action: filters.action,
    decision: filters.decision,
    userId: filters.userId,
    clientIp: filters.clientIp,
    startAt: filters.startAt,
    endAt: filters.endAt
  });

  return jsonResponse({
    success: true,
    data: {
      ...rows,
      sourceSummary
    }
  });
}
