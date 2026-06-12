import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseLimitOffset,
  parseJsonBody
} from '../_shared/phase1Api.js';
import { fetchLeadsByInstitution, insertLead, updateLead } from '../_shared/dbLayer.js';
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

  const auth = await parseAuthContext(request, env);
  const role = STR(auth?.role);
  if (!['founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method === 'GET') {
    const { limit, offset } = parseLimitOffset(request);
    const filters = {
      institutionId,
      limit,
      offset,
      status: STR(parsed.searchParams.get('status')),
      q: STR(parsed.searchParams.get('q'))
    };
    const result = await fetchLeadsByInstitution(env.DB, filters);
    return apiSuccess(
      {
        items: result?.items || [],
        total: Number(result?.total || 0),
        limit: Number(result?.limit || limit),
        offset: Number(result?.offset || offset),
        nextOffset: Number(result?.nextOffset || 0)
      },
      ctx
    );
  }

  if (request.method === 'POST') {
    const payload = await parseJsonBody(request);
    const inserted = await insertLead(env.DB, {
      institutionId,
      guardianName: STR(payload?.guardianName || payload?.name),
      studentGrade: STR(payload?.studentGrade),
      needSummary: STR(payload?.needSummary),
      status: STR(payload?.status || 'new'),
      aiRecommendation: STR(payload?.aiRecommendation)
    });

    if (!inserted?.id) {
      return apiError('Create lead failed', 500, 500, ctx);
    }

    return apiSuccess(
      {
        lead: inserted
      },
      ctx
    );
  }

  if (request.method === 'PATCH') {
    const payload = await parseJsonBody(request);
    const leadId = STR(payload?.leadId || parsed.searchParams.get('leadId'));
    if (!leadId) {
      return apiError('leadId required', 400, 400, ctx);
    }

    const updated = await updateLead(env.DB, leadId, institutionId, {
      status: payload?.status !== undefined ? STR(payload.status) : undefined,
      studentGrade: payload?.studentGrade !== undefined ? STR(payload.studentGrade) : undefined,
      needSummary: payload?.needSummary !== undefined ? STR(payload.needSummary) : undefined,
      aiRecommendation: payload?.aiRecommendation !== undefined ? STR(payload.aiRecommendation) : undefined
    });

    if (!updated) {
      return apiError('update failed', 500, 500, ctx);
    }

    return apiSuccess(
      {
        leadId,
        updated: true
      },
      ctx
    );
  }

  return apiError('Method Not Allowed', 405, 405, ctx);
}
