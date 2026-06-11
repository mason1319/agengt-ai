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
  return parsed > 0 ? Math.max(1, Math.round(parsed)) : fallback;
}

function parseLimit(value, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

function parseBoolean(value, fallback = false) {
  if (typeof value === 'string') {
    return `${value}`.trim().toLowerCase() === 'true' || `${value}` === '1';
  }
  return !!value;
}

function normalizeDate(value, mode = 'start') {
  const text = `${value || ''}`.trim();
  if (!text) {
    return '';
  }
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  if (text.length > 10) {
    return text;
  }
  return mode === 'end' ? `${text}T23:59:59Z` : `${text}T00:00:00Z`;
}

function escapeCsv(value = '') {
  const text = `${value ?? ''}`.replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${text}"`;
}

function sourceCategory(source = '') {
  const normalized = `${source || ''}`.trim().toLowerCase();
  if (!normalized) {
    return '未知';
  }
  if (normalized.includes('mock')) {
    return '模拟';
  }
  if (normalized.includes('real') || normalized.includes('provider')) {
    return '真实';
  }
  return '未知';
}

function defaultStartAt(days = 30) {
  const offset = 1000 * 60 * 60 * 24 * Math.max(Math.round(days), 1);
  return new Date(Date.now() - offset).toISOString().slice(0, 10);
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
  const days = parseDays(url.searchParams.get('days'), 30);
  const includeUsers = parseBoolean(url.searchParams.get('includeUsers'), false);
  const userLimit = parseLimit(url.searchParams.get('userLimit'), 20);
  const limit = parseLimit(url.searchParams.get('limit'), 50);
  const startAt = normalizeDate(url.searchParams.get('startAt'), 'start') || defaultStartAt(days);
  const endAt = normalizeDate(url.searchParams.get('endAt'), 'end') || '';

  const summaryRows = await fetchAiUsageSummary(env.DB, {
    institutionId,
    startAt,
    endAt,
    limit: limit
  });

  const sourceSummary = await fetchAiUsageSourceSummary(env.DB, {
    institutionId,
    startAt,
    endAt
  });

  const aiRows = Array.isArray(summaryRows) ? summaryRows : [];
  const header = ['机构名称', '套餐', '套餐编码', '窗口内AI消耗', '月度配额', '请求数', '最后请求时间', 'AI来源', '来源分类'];
  const lines = aiRows.map((org = {}) => {
    const source = org.source || 'provider';
    return [
      escapeCsv(org.institutionName || ''),
      escapeCsv(org.plan || ''),
      escapeCsv(org.planCode || ''),
      escapeCsv(org.aiUsedWindow || 0),
      escapeCsv(org.aiLimitMonthly || 0),
      escapeCsv(org.requestsWindow || 0),
      escapeCsv(org.lastUsedAt || ''),
      escapeCsv(source),
      escapeCsv(sourceCategory(source))
    ].join(',');
  });

  let topUsersLines = [];
  if (institutionId && includeUsers) {
    const topUsers = await fetchAiUsageTopUsers(env.DB, {
      institutionId,
      startAt,
      endAt,
      limit: userLimit
    });

    if (Array.isArray(topUsers) && topUsers.length > 0) {
      topUsersLines = [
        '',
        ['[TopUsers]'].map(escapeCsv).join(','),
        ['userId', 'userName', 'role', 'tokens', 'requests', 'lastUsedAt'].map(escapeCsv).join(',')
      ];
      topUsersLines = topUsersLines.concat(topUsers.map((user = {}) => [
        escapeCsv(user.userId || ''),
        escapeCsv(user.userName || ''),
        escapeCsv(user.role || ''),
        escapeCsv(user.aiUsedWindow || 0),
        escapeCsv(user.requestsWindow || 0),
        escapeCsv(user.lastUsedAt || '')
      ].join(',')));
    }
  }

  const safeSourceSummary = {
    realRequests: Number(sourceSummary?.realRequests || 0),
    mockRequests: Number(sourceSummary?.mockRequests || 0),
    unknownRequests: Number(sourceSummary?.unknownRequests || 0),
    totalRequests: Number(sourceSummary?.totalRequests || 0)
  };

  const totalRequests = safeSourceSummary.totalRequests;
  const realPercent = totalRequests > 0 ? Math.round((safeSourceSummary.realRequests / totalRequests) * 100) : 0;
  const mockPercent = totalRequests > 0 ? Math.round((safeSourceSummary.mockRequests / totalRequests) * 100) : 0;
  const unknownPercent = totalRequests > 0 ? Math.round((safeSourceSummary.unknownRequests / totalRequests) * 100) : 0;
  const summary = [
    '',
    ['[来源告警汇总]'].map(escapeCsv).join(','),
    ['指标', '值', '阈值', '状态'].map(escapeCsv).join(','),
    [escapeCsv('真实来源请求占比'), escapeCsv(`${realPercent}%`), '-', '-'].join(','),
    [escapeCsv('模拟来源请求占比'), escapeCsv(`${mockPercent}%`), escapeCsv('30%'), (mockPercent >= 30 ? escapeCsv('告警') : escapeCsv('正常'))].join(','),
    [escapeCsv('来源未知请求占比'), escapeCsv(`${unknownPercent}%`), escapeCsv('10%'), (unknownPercent >= 10 ? escapeCsv('告警') : escapeCsv('正常'))].join(','),
    [escapeCsv('来源总请求'), escapeCsv(totalRequests), '', ''].join(','),
    [escapeCsv('真实来源请求'), escapeCsv(safeSourceSummary.realRequests), '', ''].join(','),
    [escapeCsv('模拟来源请求'), escapeCsv(safeSourceSummary.mockRequests), '', ''].join(','),
    [escapeCsv('来源未知请求'), escapeCsv(safeSourceSummary.unknownRequests), '', ''].join(',')
  ];

  const csv = [
    header.map(escapeCsv).join(','),
    ...lines,
    ...topUsersLines,
    ...summary
  ].join('\n');

  return jsonResponse({
    success: true,
    data: {
      fileName: `starmate-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv;charset=utf-8',
      content: `\ufeff${csv}`,
      sourceSummary: safeSourceSummary,
      filter: {
        institutionId,
        days,
        limit,
        startAt,
        endAt,
        includeUsers,
        userLimit
      }
    }
  });
}
