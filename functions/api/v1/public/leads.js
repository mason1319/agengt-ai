import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../_shared/phase1Api.js';
import {
  fetchLeadsByInstitution,
  insertLead,
  insertLeadMessage
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  const parsed = new URL(request.url);
  const auth = await parseAuthContext(request, env, { allowRoleHint: true });

  if (request.method === 'GET') {
    if (auth?.role && !['founder', 'platform', 'teacher'].includes(STR(auth.role))) {
      return apiError('No permission', 403, 403, ctx);
    }

    const rows = await fetchLeadsByInstitution(env.DB, {
      institutionId: STR(parsed.searchParams.get('institutionId')),
      limit: Number(parsed.searchParams.get('limit') || 50),
      offset: Number(parsed.searchParams.get('offset') || 0),
      status: STR(parsed.searchParams.get('status')),
      q: STR(parsed.searchParams.get('q'))
    });

    const safeRows = rows || {};
    return apiSuccess({
      institutionId: STR(parsed.searchParams.get('institutionId')),
      items: safeRows.items || [],
      total: Number(safeRows.total || 0),
      limit: Number(safeRows.limit || 50),
      offset: Number(safeRows.offset || 0),
      nextOffset: Number(safeRows.nextOffset || 0)
    }, ctx);
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const payload = await parseJsonBody(request);
  const institutionId = STR(payload?.institutionId || parsed.searchParams.get('institutionId'));
  const guardianName = STR(payload?.guardianName || payload?.name);

  if (!institutionId || !guardianName) {
    return apiError('institutionId and guardianName required', 400, 400, ctx);
  }

  const inserted = await insertLead(env.DB, {
    institutionId,
    guardianName,
    studentGrade: STR(payload?.studentGrade),
    needSummary: STR(payload?.needSummary),
    status: STR(payload?.status || 'new'),
    aiRecommendation: STR(payload?.aiRecommendation)
  });

  if (!inserted) {
    return apiError('Create lead failed', 500, 500, ctx);
  }

  await insertLeadMessage(env.DB, {
    leadId: inserted.id,
    actorRole: 'public',
    sender: STR(payload?.guardianName),
    message: STR(payload?.initialMessage || payload?.message || ''),
    tone: 'neutral'
  });

  return apiSuccess({
    lead: inserted,
    privacyConsent: !!payload?.privacyConsent
  }, ctx);
}
