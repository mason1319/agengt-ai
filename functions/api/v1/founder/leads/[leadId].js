import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../_shared/phase1Api.js';
import { parseAuthContext } from '../../_shared/runtimeData.js';
import { updateLead } from '../../_shared/dbLayer.js';

const STR = (value = '') => `${value || ''}`.trim();

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env, params } = ctx;

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
  const leadId = STR(params?.leadId);
  if (!leadId) {
    return apiError('leadId required', 400, 400, ctx);
  }

  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  if (request.method !== 'PATCH') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const payload = await parseJsonBody(request);
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
