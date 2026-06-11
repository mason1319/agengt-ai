import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../../_shared/phase1Api.js';
import {
  insertLeadMessage,
  updateLead
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

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

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const leadId = STR(params?.leadId);
  if (!leadId) {
    return apiError('leadId required', 400, 400, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);

  const lead = await env.DB
    .prepare(
      `SELECT id, institution_id, guardian_name
       FROM leads
       WHERE id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}`
    )
    .bind(...(institutionId ? [leadId, institutionId] : [leadId]))
    .first();

  if (!lead?.id) {
    return apiError('lead not found', 404, 404, ctx);
  }

  const payload = await parseJsonBody(request);
  const note = STR(payload?.note);

  const updated = await updateLead(env.DB, lead.id, lead.institution_id, {
    status: 'handling'
  });
  await insertLeadMessage(env.DB, {
    leadId: lead.id,
    actorRole: role,
    sender: STR(auth?.user?.name || role),
    message: STR(note || `已由 ${STR(auth?.user?.name || role)} 接管咨询`),
    tone: 'manual'
  });

  return apiSuccess(
    {
      leadId: lead.id,
      institutionId: lead.institution_id,
      status: 'handling',
      updated: !!updated
    },
    ctx
  );
}
