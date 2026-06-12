import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';
import {
  fetchOrganizationsForPlatform,
  fetchInstitutionById,
  insertInstitution,
  updateInstitutionById
} from '../_shared/dbLayer.js';

const ALLOWED_ACTIONS = ['activate', 'suspend', 'extend_trial', 'upgrade', 'downgrade'];

function parsePatch(payload = {}) {
  const out = {};

  if (payload.status) {
    out.status = `${payload.status}`.trim();
  }

  if (payload.planCode !== undefined) {
    const planCode = `${payload.planCode}`.trim();
    if (planCode) {
      out.plan_code = planCode;
    }
  }

  if (payload.planMode !== undefined) {
    const planMode = `${payload.planMode}`.trim();
    if (planMode) {
      out.plan_mode = planMode;
    }
  }

  if (payload.studentLimit !== undefined) {
    out.student_limit = Number(payload.studentLimit);
  }

  if (payload.teacherLimit !== undefined) {
    out.teacher_limit = Number(payload.teacherLimit);
  }

  if (payload.aiLimitMonthly !== undefined) {
    out.ai_limit_monthly = Number(payload.aiLimitMonthly);
  }

  if (payload.trialEndsAt) {
    out.trial_ends_at = `${payload.trialEndsAt}`.trim();
  }

  if (payload.subscriptionStartsAt) {
    out.subscription_starts_at = `${payload.subscriptionStartsAt}`.trim();
  }

  if (payload.subscriptionEndsAt) {
    out.subscription_ends_at = `${payload.subscriptionEndsAt}`.trim();
  }

  if (payload.action === 'extend_trial') {
    const days = Number(payload.extendTrialDays || 14);
    if (Number.isFinite(days) && days > 0) {
      const base = new Date();
      base.setDate(base.getDate() + days);
      out.trial_ends_at = base.toISOString().slice(0, 10);
      out.status = 'trial';
      out.plan_code = 'trial';
    }
  }

  if (payload.action === 'activate') {
    out.status = 'normal';
  }

  if (payload.action === 'suspend') {
    out.status = 'expired';
  }

  if (payload.action === 'upgrade') {
    out.plan_code = 'standard';
    out.status = 'normal';
  }

  if (payload.action === 'downgrade') {
    out.plan_code = 'trial';
    out.status = 'trial';
  }

  return out;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  if (auth?.role !== 'platform') {
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

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const institutionId = `${url.searchParams.get('institutionId') || ''}`.trim();

    if (!institutionId) {
      const list = await fetchOrganizationsForPlatform(env.DB);
      return jsonResponse({
        success: true,
        total: Array.isArray(list) ? list.length : 0,
        data: {
          institutions: list || []
        }
      });
    }

    const institution = await fetchInstitutionById(env.DB, institutionId);
    if (!institution) {
      return jsonResponse({ success: false, error: 'institution not found' }, 404);
    }

    return jsonResponse({
      success: true,
      data: {
        institution
      }
    });
  }

  if (request.method === 'PATCH' || request.method === 'POST') {
    const payload = await request.json().catch(() => ({}));

    const institutionId = `${payload?.institutionId || payload?.id || ''}`.trim();
    const action = `${payload?.action || ''}`.trim();

    if (!institutionId && request.method === 'POST') {
      const name = `${payload?.name || ''}`.trim();
      if (!name) {
        return jsonResponse({ success: false, error: 'name is required' }, 400);
      }

      const created = await insertInstitution(env.DB, {
        ...payload,
        name,
        id: `${payload?.id || ''}`.trim() || undefined
      });
      if (!created) {
        return jsonResponse({ success: false, error: 'Create failed' }, 500);
      }

      const next = await fetchInstitutionById(env.DB, created.id);
      return jsonResponse({
        success: true,
        data: {
          before: null,
          after: next || created
        }
      });
    }

    if (!institutionId) {
      return jsonResponse({ success: false, error: 'institutionId is required' }, 400);
    }

    const current = await fetchInstitutionById(env.DB, institutionId);
    if (!current) {
      return jsonResponse({ success: false, error: 'institution not found' }, 404);
    }

    const updates = parsePatch(payload);

    if (action && !ALLOWED_ACTIONS.includes(action)) {
      return jsonResponse({ success: false, error: 'action not allowed' }, 400);
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ success: false, error: 'No valid update field' }, 400);
    }

    const ok = await updateInstitutionById(env.DB, institutionId, updates);
    if (!ok) {
      return jsonResponse({ success: false, error: 'Update failed' }, 500);
    }

    const next = await fetchInstitutionById(env.DB, institutionId);
    return jsonResponse({
      success: true,
      data: {
        before: current,
        after: next
      }
    });
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
