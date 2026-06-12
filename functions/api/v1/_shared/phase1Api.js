import { jsonResponse, parseAuthContext } from './runtimeData.js';

const API_ERROR_CODE = {
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
};

const DEFAULT_SUCCESS_MESSAGE = 'ok';

const normalizeRole = (value = '') => `${value || ''}`.toLowerCase().trim();

const randomTraceId = () => {
  const raw = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return raw;
};

const getRequestHeader = (request, key) => {
  const value = request?.headers?.get?.(key);
  return `${value || ''}`.trim();
};

export function buildApiContext({ request, env, params } = {}) {
  const requestId =
    getRequestHeader(request, 'x-request-id') || getRequestHeader(request, 'x-cf-request-id') || randomTraceId();
  const traceId = getRequestHeader(request, 'x-trace-id') || requestId;

  return {
    request,
    env,
    params,
    requestId,
    traceId,
    code: 0,
    envName: `${env?.APP_ENV || ''}`.trim().toLowerCase() || 'production',
  };
}

export function apiError(message, code = API_ERROR_CODE.BAD_REQUEST, statusCode = 400, context = {}) {
  const payload = {
    code,
    message,
    data: null,
    request_id: context.requestId || randomTraceId(),
    trace_id: context.traceId || context.requestId || randomTraceId()
  };

  return jsonResponse(payload, statusCode);
}

export function apiSuccess(payload, context = {}, statusCode = 200, message = DEFAULT_SUCCESS_MESSAGE) {
  const response = {
    code: 0,
    message,
    data: payload === undefined ? null : payload,
    request_id: context.requestId || randomTraceId(),
    trace_id: context.traceId || context.requestId || randomTraceId()
  };

  return jsonResponse(response, statusCode);
}

export async function requireAuthAndRole(context, allowedRoles = []) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles.map(normalizeRole) : [];
  const auth = await parseAuthContext(context.request, context.env);

  if (!auth?.role || !auth?.user?.id) {
    return {
      auth: null,
      response: apiError('Auth required', API_ERROR_CODE.UNAUTHORIZED, 401, context)
    };
  }

  const role = normalizeRole(auth.role);
  if (allowed.length > 0 && !allowed.includes(role)) {
    return {
      auth: null,
      response: apiError('No permission', API_ERROR_CODE.FORBIDDEN, 403, context)
    };
  }

  return {
    auth,
    response: null
  };
}

export async function requireInstitution(auth, institutionId, fallbackInstitutionId = '') {
  const resolved = `${institutionId || auth?.user?.institutionId || fallbackInstitutionId || ''}`.trim();
  if (!resolved) {
    return '';
  }

  return resolved;
}

export function parseJsonBody(request) {
  return request.json().catch(() => ({}));
}

export function parseText(value, fallback = '') {
  return `${value || ''}`.trim() || fallback;
}

export function parseLimitOffset(request) {
  const query = new URL(request.url);
  const rawLimit = Number(query.searchParams.get('limit') || 50);
  const rawOffset = Number(query.searchParams.get('offset') || 0);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.max(rawLimit, 1), 500) : 50;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  return { limit, offset, query };
}
