import {
  fetchAiAuditLogs,
  fetchAiAuditSourceSummary
} from '../_shared/dbLayer.js';
import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';

function parseLimitParam(value, fallback = 2000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(Math.floor(parsed), 5000));
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
    limit: parseLimitParam(url.searchParams.get('limit'), 2000)
  };
}

function escapeCsv(value = '') {
  const text = `${value ?? ''}`.replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${text}"`;
}

function getSourceCategory(source = '') {
  const normalized = `${source || ''}`.trim().toLowerCase();
  if (!normalized || normalized === 'unknown') {
    return 'unknown';
  }
  if (normalized.includes('mock')) {
    return 'mock';
  }
  return 'real';
}

function sourceLabel(source = '') {
  const map = {
    real: '真实',
    mock: '模拟',
    unknown: '未知'
  };
  return map[getSourceCategory(source)] || '未知';
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
    offset: 0
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

  const header = ['时间', '机构', '机构ID', '角色', '用户ID', '动作', '决策', '延迟(ms)', 'Tokens', '理由', '来源', '来源分类', 'IP', '请求参数', '响应参数'];
  const lines = Array.isArray(rows) ? rows.map((row = {}) => [
    escapeCsv(row.createdAt || ''),
    escapeCsv(row.institutionName || ''),
    escapeCsv(row.institutionId || ''),
    escapeCsv(row.role || ''),
    escapeCsv(row.userId || ''),
    escapeCsv(row.action || ''),
    escapeCsv(row.decision || ''),
    escapeCsv(row.latencyMs || 0),
    escapeCsv(row.tokensUsed || 0),
    escapeCsv(row.reason || ''),
    escapeCsv(row.source || ''),
    escapeCsv(sourceLabel(row.source || '')),
    escapeCsv(row.clientIp || ''),
    escapeCsv(row.requestPayload || ''),
    escapeCsv(row.responsePayload || '')
  ].join(',')) : [];

  const sourceTotal = Number(sourceSummary?.totalRequests || 0);
  const sourceReal = Number(sourceSummary?.realRequests || 0);
  const sourceMock = Number(sourceSummary?.mockRequests || 0);
  const sourceUnknown = Number(sourceSummary?.unknownRequests || 0);
  const realPercent = sourceTotal > 0 ? Math.round((sourceReal / sourceTotal) * 100) : 0;
  const mockPercent = sourceTotal > 0 ? Math.round((sourceMock / sourceTotal) * 100) : 0;
  const unknownPercent = sourceTotal > 0 ? Math.round((sourceUnknown / sourceTotal) * 100) : 0;

  const summary = [
    '',
    '"[来源告警汇总]"',
    ['整体来源风险', '', '', ''].join(','),
    ['指标', '值', '阈值', '状态'].map(escapeCsv).join(','),
    [escapeCsv('真实来源请求占比'), escapeCsv(`${realPercent}%`), '-', '-'].join(','),
    [escapeCsv('模拟来源请求占比'), escapeCsv(`${mockPercent}%`), escapeCsv('30%'), (mockPercent >= 30 ? escapeCsv('告警') : escapeCsv('正常'))].join(','),
    [escapeCsv('来源未知请求占比'), escapeCsv(`${unknownPercent}%`), escapeCsv('10%'), (unknownPercent >= 10 ? escapeCsv('告警') : escapeCsv('正常'))].join(','),
    [escapeCsv('来源总请求'), escapeCsv(sourceTotal), '', ''].join(','),
    [escapeCsv('真实来源请求'), escapeCsv(sourceReal), '', ''].join(','),
    [escapeCsv('模拟来源请求'), escapeCsv(sourceMock), '', ''].join(','),
    [escapeCsv('来源未知请求'), escapeCsv(sourceUnknown), '', ''].join(',')
  ];

  const csv = [
    header.map(escapeCsv).join(','),
    ...lines,
    ...summary
  ].join('\n');

  return jsonResponse({
    success: true,
    data: {
      fileName: `starmate-ai-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv;charset=utf-8',
      content: `\ufeff${csv}`
    }
  });
}
