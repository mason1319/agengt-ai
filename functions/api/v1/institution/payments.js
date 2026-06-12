import {
  fetchPaymentsByInstitution,
  fetchPaymentById,
  insertPayment,
  updatePayment
} from '../_shared/dbLayer.js';
import { jsonResponse, parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value) => `${value || ''}`.trim();
const toNum = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function resolveInstitutionId(auth, request) {
  const url = request?.url || request;
  const parsed = new URL(`${url}`);
  return STR(parsed.searchParams.get('institutionId')) || STR(auth?.user?.institutionId);
}

function buildPagination(search) {
  const limit = toNum(search.get('limit'), 50);
  const offset = Math.max(0, toNum(search.get('offset'), 0));
  return {
    limit: Math.min(Math.max(limit, 1), 200),
    offset
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';
  const parsed = new URL(request.url);

  if (!env?.DB && request.method !== 'GET') {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const institutionId = resolveInstitutionId(auth, request);
  if (!institutionId && ['platform', 'founder', 'teacher'].includes(role)) {
    return jsonResponse({ success: false, error: 'institutionId required' }, 400);
  }

  if (request.method === 'GET') {
    const { limit, offset } = buildPagination(parsed.searchParams);

    if ((role === 'parent' || role === 'student')) {
      return jsonResponse({ success: false, error: 'No permission' }, 403);
    }

    const paymentId = STR(parsed.searchParams.get('paymentId'));
    if (paymentId) {
      const single = await fetchPaymentById(env.DB, paymentId, institutionId);
      if (!single) {
        return jsonResponse({ success: false, error: 'payment not found' }, 404);
      }

      if (role === 'teacher' && STR(single.userId) !== STR(auth?.user?.id)) {
        return jsonResponse({ success: false, error: 'No permission' }, 403);
      }

      return jsonResponse({
        success: true,
        data: {
          payment: single
        }
      });
    }

    const result = await fetchPaymentsByInstitution(env.DB, {
      institutionId,
      limit,
      offset,
      status: STR(parsed.searchParams.get('status')),
      planCode: STR(parsed.searchParams.get('planCode'))
    });

    return jsonResponse({
      success: true,
      total: result?.total || 0,
      data: {
        payments: Array.isArray(result?.items) ? result.items : [],
        limit,
        offset,
        nextOffset: result?.nextOffset || 0
      }
    });
  }

  if (!['platform', 'founder'].includes(role)) {
    return jsonResponse({ success: false, error: 'No permission' }, 403);
  }

  if (request.method === 'POST') {
    if (!['platform', 'founder'].includes(role)) {
      return jsonResponse({ success: false, error: 'Only platform/founder can create payment records' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const orderNo = STR(payload.orderNo);
    const planCode = STR(payload.planCode || 'trial');
    const planMode = STR(payload.planMode || 'monthly');
    const periodDays = Math.max(1, Math.round(toNum(payload.periodDays, 30)));
    const amountCents = Math.max(1, Math.round(toNum(payload.amountCents, 0)));
    const currency = STR(payload.currency || 'CNY');
    const status = STR(payload.status || 'pending');

    if (!orderNo || !institutionId || amountCents <= 0) {
      return jsonResponse({
        success: false,
        error: 'orderNo, institutionId, amountCents required'
      }, 400);
    }

    const inserted = await insertPayment(env.DB, {
      institutionId,
      orderNo,
      userId: STR(payload.userId),
      planCode,
      planMode,
      periodDays,
      currency,
      status,
      amountCents
    });

    if (!inserted) {
      return jsonResponse({ success: false, error: 'Create payment failed' }, 500);
    }

    const row = await fetchPaymentById(env.DB, inserted.id, institutionId);
    return jsonResponse({
      success: true,
      data: {
        payment: row || inserted
      }
    });
  }

  if (request.method === 'PATCH') {
    if (role === 'teacher' && !auth?.user?.id) {
      return jsonResponse({ success: false, error: 'No permission' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const paymentId = STR(payload.id || parsed.searchParams.get('paymentId'));
    if (!paymentId) {
      return jsonResponse({ success: false, error: 'paymentId required' }, 400);
    }

    const changes = {
      status: payload.status !== undefined ? STR(payload.status) : undefined,
      paidAt: payload.paidAt !== undefined ? STR(payload.paidAt) : undefined,
      startsAt: payload.startsAt !== undefined ? STR(payload.startsAt) : undefined,
      expiresAt: payload.expiresAt !== undefined ? STR(payload.expiresAt) : undefined
    };

    const ok = await updatePayment(env.DB, paymentId, institutionId, changes);
    if (!ok) {
      return jsonResponse({ success: false, error: 'Update failed' }, 500);
    }

    const row = await fetchPaymentById(env.DB, paymentId, institutionId);
    return jsonResponse({
      success: true,
      data: {
        payment: row || null
      }
    });
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
