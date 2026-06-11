import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../_shared/phase1Api.js';
import {
  fetchAiUsageSummary,
  fetchAiUsageTopUsers,
  fetchAiUsageSourceSummary
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return /^(1|true|y|yes)$/.test(`${value}`.toLowerCase());
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.round(parsed));
}

function parseDate(value, mode = 'start') {
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
  const role = STR(auth?.role).toLowerCase();
  if (!['founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);
  if (!institutionId) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const startAt = parseDate(parsed.searchParams.get('startAt'), 'start');
  const endAt = parseDate(parsed.searchParams.get('endAt'), 'end');
  const includeUsers = parseBoolean(parsed.searchParams.get('includeUsers'), false);
  const userLimit = parseNumber(parsed.searchParams.get('userLimit'), 20);
  const limit = parseNumber(parsed.searchParams.get('limit'), 50);

  const summaryList = await fetchAiUsageSummary(env.DB, {
    institutionId,
    startAt: startAt || undefined,
    endAt: endAt || undefined
  });
  const sourceSummary = await fetchAiUsageSourceSummary(env.DB, {
    institutionId,
    startAt: startAt || undefined,
    endAt: endAt || undefined
  });

  const summary = Array.isArray(summaryList) && summaryList.length ? summaryList[0] : null;
  let topUsers = [];
  if (includeUsers) {
    topUsers = await fetchAiUsageTopUsers(env.DB, {
      institutionId,
      startAt: startAt || undefined,
      endAt: endAt || undefined,
      limit: Math.max(1, Math.min(userLimit, 50))
    });
  }

  return apiSuccess(
    {
      institutionId,
      window: {
        startAt: startAt || null,
        endAt: endAt || null
      },
      limit,
      summary,
      sourceSummary: sourceSummary || { realRequests: 0, mockRequests: 0, unknownRequests: 0, totalRequests: 0 },
      topUsers,
      topUsersLimit: includeUsers ? Math.max(1, Math.min(userLimit, 50)) : 0,
      totalInstitutions: 1
    },
    ctx
  );
}
