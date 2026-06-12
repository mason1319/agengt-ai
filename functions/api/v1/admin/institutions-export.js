import { jsonResponse, parseAuthContext } from '../_shared/runtimeData.js';
import { fetchOrganizationsForPlatform, fetchAiAuditSourceSummary, fetchAiUsageSourceSummary } from '../_shared/dbLayer.js';

function escapeCsv(value = '') {
  const text = `${value ?? ''}`.replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${text}"`;
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

  const organizations = await fetchOrganizationsForPlatform(env.DB);
  const header = ['机构名称', '套餐', '模式', '学员', '老师', 'AI已用', 'AI配额', '状态', '到期日'];
  const rows = Array.isArray(organizations)
    ? organizations.map((org = {}) => [
      escapeCsv(org.name),
      escapeCsv(org.plan || org.planCode || ''),
      escapeCsv(org.planMode || ''),
      escapeCsv(org.students || org.studentCount || 0),
      escapeCsv(org.teachers || org.teacherCount || 0),
      escapeCsv(org.aiUsed || 0),
      escapeCsv(org.aiLimit || org.aiLimitMonthly || 0),
      escapeCsv(org.status || ''),
      escapeCsv(org.expires || org.trialEndsAt || '')
    ].join(','))
    : [];

  const csv = [header.map(escapeCsv).join(','), ...rows].join('\n');

  return jsonResponse({
    success: true,
    data: {
      fileName: `starmate-platform-report-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv;charset=utf-8',
      content: `\ufeff${csv}`
    }
  });
}
