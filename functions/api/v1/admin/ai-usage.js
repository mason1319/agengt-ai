import {
  fetchAiUsageSummary,
  fetchAiUsageTopUsers,
  fetchAiUsageSourceSummary
} from '../_shared/dbLayer.js';
import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';

function parseDays(value, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const safeDays = Math.round(parsed);
  return safeDays > 0 ? safeDays : 1;
}

function parseLimit(value, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

function normalizeDate(value, mode = 'start') {
  const text = `${value || ''}`.trim();
  if (!text) {
    return '';
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (text.length > 10) {
    return text;
  }

  return mode === 'end' ? `${text}T23:59:59Z` : `${text}T00:00:00Z`;
}

function defaultStartAt(days = 30) {
  const offset = 1000 * 60 * 60 * 24 * Math.max(Math.round(days), 1);
  return new Date(Date.now() - offset).toISOString().slice(0, 10);
}

function clampBoolean(value, fallback = false) {
  if (typeof value === 'string') {
    return `${value}`.toLowerCase() === 'true' || `${value}` === '1';
  }
  return value ? true : fallback;
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
  const institutionId = `${url.searchParams.get('institutionId') || ''}`.trim();
  const queryDays = parseDays(url.searchParams.get('days'), 30);
  const limit = parseLimit(url.searchParams.get('limit'), 50);
  const includeUsers = clampBoolean(url.searchParams.get('includeUsers'), false);
  const userLimit = parseLimit(url.searchParams.get('userLimit'), 20);
  const startAt = normalizeDate(url.searchParams.get('startAt'), 'start') || defaultStartAt(queryDays);
  const endAt = normalizeDate(url.searchParams.get('endAt'), 'end') || '';

  const summaryRows = await fetchAiUsageSummary(env.DB, {
    institutionId,
    startAt,
    endAt
  });
  const sourceSummary = await fetchAiUsageSourceSummary(env.DB, {
    institutionId,
    startAt,
    endAt
  });
  const safeSourceSummary = {
    realRequests: Number(sourceSummary?.realRequests || 0),
    mockRequests: Number(sourceSummary?.mockRequests || 0),
    unknownRequests: Number(sourceSummary?.unknownRequests || 0),
    totalRequests: Number(sourceSummary?.totalRequests || 0)
  };

  const rows = Array.isArray(summaryRows) ? summaryRows : [];
  const item = institutionId ? rows[0] || null : null;
  const summary = institutionId ? item : null;
  const totalInstitutions = institutionId ? 1 : rows.length;
  const selectedInstitutionId = institutionId || '';

  if (institutionId && includeUsers) {
    const topUsers = await fetchAiUsageTopUsers(env.DB, {
      institutionId,
      startAt,
      endAt,
      limit: userLimit
    });

    return jsonResponse({
      success: true,
      data: {
        window: {
          days: queryDays,
          startAt,
          endAt
        },
        institutionId: selectedInstitutionId,
        totalInstitutions,
        items: rows,
        summary: summary || null,
        topUsers: Array.isArray(topUsers) ? topUsers : [],
        userLimit,
        sourceSummary: safeSourceSummary
      }
    });
  }

  return jsonResponse({
    success: true,
    data: {
      window: {
        days: queryDays,
        startAt,
        endAt
      },
      institutionId: selectedInstitutionId,
      totalInstitutions,
      limit,
      items: rows,
      summary: summary || null,
      sourceSummary: safeSourceSummary
    }
  });
}
