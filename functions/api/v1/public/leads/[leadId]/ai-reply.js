import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../../_shared/phase1Api.js';
import { insertLeadMessage, updateLead } from '../../../_shared/dbLayer.js';

const STR = (value = '') => `${value || ''}`.trim();

function buildAiReply(payload = {}) {
  const name = STR(payload.guardianName || '家长');
  const need = STR(payload?.needSummary);
  const msg = STR(payload?.message);
  return `已收到来自 ${name} 的咨询：${need || '课程咨询'}。我们会在 30 秒内安排 AI 咨询师回复；当前可先确认试听偏好：${msg || '请尽快安排合适时间'}。`;
}

export async function onRequest(context) {
  const ctx = buildApiContext(context);
  const { request, env, params } = ctx;
  const leadId = STR(params?.leadId);

  if (request.method === 'OPTIONS') {
    return apiSuccess({ ok: true }, ctx);
  }

  if (!env?.DB) {
    return apiError('D1 database not bound. Please configure wrangler d1_databases DB.', 500, 500, ctx);
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  if (!leadId) {
    return apiError('leadId required', 400, 400, ctx);
  }

  const lead = await env.DB.prepare('SELECT id, institution_id, guardian_name FROM leads WHERE id = ?1 LIMIT 1')
    .bind(leadId)
    .first();

  if (!lead?.id) {
    return apiError('lead not found', 404, 404, ctx);
  }

  const payload = await parseJsonBody(request);
  const message = STR(payload?.message);
  const institutionId = `${lead.institution_id}`.trim();

  const aiReply = buildAiReply({
    guardianName: lead.guardian_name,
    needSummary: STR(payload?.needSummary),
    message
  });

  const logged = await insertLeadMessage(env.DB, {
    leadId,
    actorRole: 'ai',
    sender: 'AI咨询助手',
    message: `${message ? `${message}\n\n` : ''}${aiReply}`,
    tone: 'high-touch'
  });

  const updated = await updateLead(env.DB, leadId, institutionId, {
    status: 'replied'
  });

  return apiSuccess({
    leadId,
    reply: aiReply,
    messageId: logged?.id || null,
    leadUpdated: !!updated,
    mode: 'simulated'
  }, ctx);
}
