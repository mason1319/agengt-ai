import {
  APP_COPY,
  MENU_CONFIG,
  ORG_ACTIONS_BY_STATUS,
  ORG_STATUS_DEFAULTS
} from '../config/appConfig';
import {
  aiAgents,
  billingPlans,
  cultureWall,
  founderAlerts,
  leadPipeline,
  organizations,
  parentReports,
  students,
  teacherLessons
} from '../seedData';
import {
  BookOpenCheck,
  Bot,
  CreditCard,
  MessageCircleHeart,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WandSparkles
} from 'lucide-react';

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');
const getEnv = (key) => trimEnv(import.meta.env?.[key]);
const normalizeRole = (value) => {
  const role = `${value || ''}`.toLowerCase().trim();
  return ['founder', 'teacher', 'parent', 'student', 'platform'].includes(role)
    ? role
    : '';
};
const canManageCultureWallRole = (role) => ['founder', 'platform'].includes(normalizeRole(role));
const normalizeRoleFromEnv = () => getEnv('VITE_DATA_SOURCE').toLowerCase() === 'api';

const ORG_STATUS_UI = {
  normal: '正常',
  trial: '试用中',
  expired: '已到期'
};

const ORG_STATUS_API = {
  '正常': 'normal',
  '试用中': 'trial',
  '已到期': 'expired',
  normal: 'normal',
  trial: 'trial',
  expired: 'expired'
};

const ORG_PLAN_MODE_UI = {
  monthly: '月付',
  yearly: '年付'
};

const ORG_PLAN_MODE_API = {
  '月付': 'monthly',
  '年付': 'yearly',
  '试用': 'monthly',
  monthly: 'monthly',
  yearly: 'yearly'
};

const ORG_PLAN_NAME_TO_CODE = {
  体验版: 'trial',
  体验: 'trial',
  基础版: 'basic',
  基础: 'basic',
  标准版: 'standard',
  标准: 'standard',
  专业版: 'pro',
  专业: 'pro'
};

const ORG_PLAN_CODE_TO_NAME = {
  trial: '体验版',
  basic: '基础版',
  standard: '标准版',
  pro: '专业版'
};

const toIntSafe = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function getMockAIAgentOutput(action, payload = {}) {
  if (action === 'feedback_from_lesson') {
    const student = `${payload?.studentName || payload?.student || '当前学生'}`.trim();
    const topic = `${payload?.topic || '课堂内容'}`.trim();
    return {
      agent: '星语官',
      action,
      output: {
        title: '家校反馈草稿',
        content: `${student}本节《${topic}》课后反馈建议：表现有明显进步，建议课后安排 10 分钟口语复盘，避免临时督促，先做3个点再发给家长。`,
        suggestions: ['给出 1 个进步点', '给 1 个具体任务', '提醒下次目标'],
        tone: '高情商低摩擦'
      }
    };
  }

  if (action === 'exercise_generate') {
    const student = `${payload?.studentName || payload?.student || '当前学生'}`.trim();
    const grade = `${payload?.grade || payload?.studentGrade || '五年级'}`.trim();
    return {
      agent: '星练官',
      action,
      output: {
        title: '英语巩固练习',
        mission: `为 ${student} 生成的 ${grade} 巩固任务`,
        tasks: [
          '单词回忆：口头说出 8 个关键词',
          '语法练习：10 题填空',
          '阅读任务：找出3个关键词',
          '口语复述：录音2句并自评'
        ],
        difficulty: `${payload?.difficulty || '中'}`
      }
    };
  }

  return {
    agent: '星守官',
    action,
    output: {
      title: '续费风险巡检',
      level: '中',
      score: 62,
      factors: [
        { key: '近期课时', value: '需关注' },
        { key: 'AI消耗', value: '持续上升' },
        { key: '家长反馈', value: '可跟进' }
      ],
      reasons: ['检测到课后反馈提交间隔偏长', '近端口学生课时剩余偏低'],
      recommendations: ['给高风险学员发学习成果周报', '联系家长确认续费意愿']
    }
  };
};

const normalizePlanModeForUi = (value, fallback = '') => {
  const raw = `${value || ''}`.trim();
  return ORG_PLAN_MODE_UI[raw] || raw || fallback;
};

const normalizePlanModeForApi = (value, fallback = 'monthly') => {
  const raw = `${value || ''}`.trim();
  return ORG_PLAN_MODE_API[raw] || fallback;
};

const normalizeStatusForUi = (value, fallback = ORG_STATUS_API.trial) => {
  const normalized = `${value || ''}`.trim();
  return ORG_STATUS_UI[normalized] || ORG_STATUS_UI[fallback] || '试用中';
};

const normalizeStatusForApi = (value, fallback = 'trial') => ORG_STATUS_API[`${value || ''}`.trim()] || fallback;

const toPlanCodeFromText = (value) => {
  const normalized = `${value || ''}`.trim();
  return ORG_PLAN_NAME_TO_CODE[normalized] || '';
};

export const normalizeOrgForUi = (org = {}) => {
  const planCode = `${org.planCode || org.plan_code || ''}`.trim();
  const mappedStatus = normalizeStatusForUi(org.status, 'trial');
  const planFromCode = ORG_PLAN_CODE_TO_NAME[planCode] || org.plan || '';
  const normalizedPlanMode = normalizePlanModeForUi(org.planMode || org.plan_mode, '月付');

  return {
    ...org,
    id: org.id || org.institutionId || '',
    status: mappedStatus,
    planMode: normalizedPlanMode,
    plan: planFromCode || org.plan || '',
    planCode: planCode || toPlanCodeFromText(org.plan),
    limitStudents: toIntSafe(org.student_limit, toIntSafe(org.limitStudents, 0)),
    limitTeachers: toIntSafe(org.teacher_limit, toIntSafe(org.limitTeachers, 0)),
    aiLimit: toIntSafe(org.ai_limit_monthly, toIntSafe(org.aiLimit, 0)),
    students: toIntSafe(org.student_count, toIntSafe(org.students, 0)),
    teachers: toIntSafe(org.teacher_count, toIntSafe(org.teachers, 0)),
    aiUsed: toIntSafe(org.ai_used_month, toIntSafe(org.aiUsed, 0)),
    expires: `${org.expires || org.subscription_ends_at || org.trial_ends_at || ''}`.trim(),
    createdAt: org.createdAt || org.created_at || org.createdAt || '',
    updatedAt: org.updatedAt || org.updated_at || org.updatedAt || ''
  };
};

export const buildInstitutionPatchPayload = ({ org, action }) => {
  const basePatch = {
    institutionId: org?.id,
    studentLimit: toIntSafe(org?.limitStudents),
    teacherLimit: toIntSafe(org?.limitTeachers),
    aiLimitMonthly: toIntSafe(org?.aiLimit),
    planMode: normalizePlanModeForApi(org?.planMode, 'monthly')
  };

  if (org?.plan) {
    const planCode = ORG_PLAN_NAME_TO_CODE[org.plan];
    if (planCode) {
      basePatch.planCode = planCode;
    }
  }

  const targetStatus = action?.targetStatus;
  if (targetStatus) {
    basePatch.status = normalizeStatusForApi(targetStatus, 'trial');
  }

  if (action?.label === '延长试用') {
    basePatch.action = 'extend_trial';
    return basePatch;
  }

  if (action?.label === '停用') {
    basePatch.action = 'suspend';
    return basePatch;
  }

  if (action?.label === '试用演练') {
    basePatch.action = 'downgrade';
    basePatch.status = 'trial';
    basePatch.planCode = 'trial';
    return basePatch;
  }

  if (action?.label === '转正式') {
    basePatch.action = 'upgrade';
    return basePatch;
  }

  if (action?.label === '续费恢复') {
    basePatch.action = 'activate';
    return basePatch;
  }

  return basePatch;
};

export const normalizeOrganizationsForUi = (organizations = []) =>
  Array.isArray(organizations) ? organizations.map((item) => normalizeOrgForUi(item)) : [];

const buildMockRuntimeData = () => ({
  appCopy: APP_COPY,
  menuConfig: { ...MENU_CONFIG },
  founderAlerts: founderAlerts.map((item) => ({ ...item })),
  leadPipeline: leadPipeline.map((item) => ({ ...item })),
  teacherLessons: teacherLessons.map((item) => ({ ...item })),
  students: students.map((item) => ({ ...item })),
  parentReports: parentReports.map((item) => ({ ...item })),
  organizations: organizations.map((item) => ({ ...item })),
  cultureWall: {
    ...cultureWall,
    videos: cultureWall.videos.map((item) => ({ ...item })),
    photos: cultureWall.photos.map((item) => ({ ...item })),
    teachers: cultureWall.teachers.map((item) => ({ ...item })),
    feedback: cultureWall.feedback.map((item) => ({ ...item }))
  },
  billingPlans: billingPlans.map((item) => ({
    ...item,
    features: item.features.map((feature) => feature)
  })),
  aiAgents: aiAgents.map((item) => ({
    ...item,
    icon: item.icon
  })),
  orgActionsByStatus: ORG_ACTIONS_BY_STATUS,
  orgStatusDefaults: ORG_STATUS_DEFAULTS,
  appMeta: {
    source: 'mock',
    modeLabel: APP_COPY.simulatedText,
    aiProvider: 'mock',
    aiBaseUrl: 'https://api.openai.com/v1',
    aiModel: 'mock',
    appEnv: getEnv('VITE_APP_ENV') || 'development',
    loadedAt: new Date().toISOString(),
    origin: 'local-build'
  },
  platformSummary: {
    currentPlanName: '标准版',
    studentUsageText: '326 / 500 学员，AI剩余 7,840 次'
  }
});

const AI_AGENT_ICON_MAP = {
  BookOpenCheck,
  Bot,
  CreditCard,
  MessageCircleHeart,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WandSparkles
};

function normalizeAiAgents(agents = []) {
  return agents.map((agent) => {
    const iconKey = typeof agent.icon === 'string' ? agent.icon : agent.icon?.name;
    return {
      ...agent,
      icon: AI_AGENT_ICON_MAP[iconKey] || Sparkles
    };
  });
}

function mergeRuntimeData(base, patch = {}) {
  return {
    ...base,
    ...patch,
    appCopy: {
      ...base.appCopy,
      ...(patch.appCopy || {})
    },
    menuConfig: {
      ...base.menuConfig,
      ...(patch.menuConfig || {})
    },
    orgActionsByStatus: {
      ...(base.orgActionsByStatus || {}),
      ...(patch.orgActionsByStatus || {})
    },
    orgStatusDefaults: {
      ...(base.orgStatusDefaults || {}),
      ...(patch.orgStatusDefaults || {})
    },
    platformSummary: {
      ...base.platformSummary,
      ...(patch.platformSummary || {})
    }
  };
}

export const getMockRuntimeData = () => buildMockRuntimeData();
export const isApiDataSource = () => normalizeRoleFromEnv();

function normalizeCultureWallFromApi(payload) {
  const source = payload || {};
  const raw = source.data?.cultureWall || source.cultureWall || source.wall || {};
  const merged = {
    videos: Array.isArray(raw.videos)
      ? raw.videos.map((item) => ({ ...item }))
      : [],
    photos: Array.isArray(raw.photos)
      ? raw.photos.map((item) => ({ ...item }))
      : [],
    teachers: Array.isArray(raw.teachers)
      ? raw.teachers.map((item) => ({ ...item }))
      : [],
    feedback: Array.isArray(raw.feedback)
      ? raw.feedback.map((item) => ({ ...item }))
      : []
  };
  const fallback = normalizeCultureWallFromApi.getFallback
    ? normalizeCultureWallFromApi.getFallback()
    : getMockRuntimeData().cultureWall;
  const hasData = merged.videos.length + merged.photos.length + merged.teachers.length + merged.feedback.length > 0;
  return hasData ? merged : fallback;
}

normalizeCultureWallFromApi.getFallback = () => {
  const base = getMockRuntimeData().cultureWall;
  return {
    videos: (base.videos || []).map((item) => ({ ...item })),
    photos: (base.photos || []).map((item) => ({ ...item })),
    teachers: (base.teachers || []).map((item) => ({ ...item })),
    feedback: (base.feedback || []).map((item) => ({ ...item }))
  };
};

function buildCultureWallPath({
  institutionId,
  kind,
  mediaKey,
  mediaDownload = false
}) {
  const params = new URLSearchParams();
  if (institutionId) {
    params.set('institutionId', institutionId);
  }
  if (kind) {
    params.set('kind', kind);
  }
  if (mediaDownload && mediaKey) {
    params.set('mediaKey', mediaKey);
  }

  const query = params.toString();
  return query ? `/v1/admin/culture-wall?${query}` : '/v1/admin/culture-wall';
}

async function requestCultureWall({
  method = 'GET',
  path,
  token,
  role = '',
  body
}) {
  const timeoutMs = Number(getEnv('VITE_DATA_TIMEOUT_MS') || 4000);
  const timeout = Math.max(1000, timeoutMs);
  const apiBase = resolveApiBase();
  const roleQuery = trimEnv(token) ? '' : `${path.includes('?') ? '&' : '?'}role=${encodeURIComponent(role || 'platform')}`;
  const endpoint = `${apiBase}${path}${roleQuery}`;
  const headers = {
    Accept: 'application/json',
    ...buildRequestHeaders(token),
    ...(body ? { 'Content-Type': 'application/json' } : {})
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      cache: 'no-store',
      signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) {
      let message = `api request failed: ${response.status}`;
      try {
        const text = await response.text();
        if (text) {
          message = `${message} ${text}`;
        }
      } catch {
        // ignore parse error
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    const payload = await response.json();
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function requestMultipart({ path, token, role, body }) {
  const timeoutMs = Number(getEnv('VITE_DATA_TIMEOUT_MS') || 4000);
  const timeout = Math.max(1000, timeoutMs);
  const apiBase = resolveApiBase();
  const roleQuery = trimEnv(token) ? '' : `${path.includes('?') ? '&' : '?'}role=${encodeURIComponent(role || 'platform')}`;
  const endpoint = `${apiBase}${path}${roleQuery}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...buildRequestHeaders(token)
      },
      body,
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      let message = `api request failed: ${response.status}`;
      try {
        const text = await response.text();
        if (text) {
          message = `${message} ${text}`;
        }
      } catch {
        // ignore parse error
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    const payload = await response.json();
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

const buildRequestHeaders = (token) => {
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`
  };
};

const shouldUseDemoFallback = (token) => !trimEnv(token);

const resolveApiBase = () => {
  const explicitBase = getEnv('VITE_API_BASE');
  if (explicitBase) {
    return explicitBase.replace(/\/$/, '');
  }

  return '/api';
};

export async function loadRuntimeData({ role, authToken } = {}) {
  const dataSource = (getEnv('VITE_DATA_SOURCE') || 'api').toLowerCase();
  const baseData = getMockRuntimeData();
  const requestedRole = normalizeRole(role) || normalizeRole(getEnv('VITE_INITIAL_ROLE')) || '';
  const envToken = getEnv('VITE_API_TOKEN');
  const token = `${authToken || ''}`.trim();
  const explicitToken = token || (requestedRole ? '' : envToken);
  const queryToken = explicitToken ? `token=${encodeURIComponent(explicitToken)}` : '';
  const queryRole = requestedRole ? `role=${encodeURIComponent(requestedRole)}` : '';
  const queryPairs = [queryRole, queryToken].filter(Boolean).join('&');

  if (dataSource !== 'api') {
    return baseData;
  }

  const timeoutMs = Number(getEnv('VITE_DATA_TIMEOUT_MS') || 4000);
  const timeout = Math.max(1000, timeoutMs);
  const apiBase = resolveApiBase();
  const headersToken = requestedRole ? '' : explicitToken;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const endpoint = `${apiBase}/v1/bootstrap${queryPairs ? `?${queryPairs}` : ''}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...buildRequestHeaders(headersToken)
      },
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      const message = `bootstrap api response ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    const payload = await response.json();
    const data = payload?.data || {};
    const organizationsData = Array.isArray(data.organizations)
      ? normalizeOrganizationsForUi(data.organizations)
      : data.organizations;
    const mergedPlatform = requestedRole === 'platform'
      ? { ...data, organizations: organizationsData }
      : data;

    const meta = {
      ...baseData.appMeta,
      ...(payload.meta || {}),
      source: payload?.source || 'api',
      modeLabel: data?.platformSummary?.modeLabel
        || payload?.meta?.modeLabel
        || (payload?.source === 'mock' ? APP_COPY.simulatedText : '云端配置'),
      aiProvider: payload?.meta?.aiProvider || payload?.meta?.provider || baseData.appMeta.aiProvider || 'mock',
      aiBaseUrl: payload?.meta?.aiBaseUrl || payload?.meta?.baseUrl || baseData.appMeta.aiBaseUrl || '',
      aiModel: payload?.meta?.aiModel || payload?.meta?.model || baseData.appMeta.aiModel || 'mock'
    };
    let apiCultureWall = normalizeCultureWallFromApi(data);
    if (canManageCultureWallRole(requestedRole || 'founder')) {
      try {
        const wallPayload = await loadCultureWallAssets({
          authToken: explicitToken,
          role: requestedRole || 'founder'
        });
        apiCultureWall = normalizeCultureWallFromApi(wallPayload);
      } catch {
        apiCultureWall = normalizeCultureWallFromApi(data);
      }
    }

    return mergeRuntimeData(baseData, {
      ...mergedPlatform,
      cultureWall: apiCultureWall,
      organizations: Array.isArray(mergedPlatform.organizations)
        ? mergedPlatform.organizations
        : baseData.organizations,
      aiAgents: normalizeAiAgents(data.aiAgents || []),
      appMeta: {
        ...baseData.appMeta,
        ...meta,
        appEnv: getEnv('VITE_APP_ENV') || payload?.appEnv || 'production'
      }
    });
  } catch (error) {
    if (explicitToken && (error?.status === 401 || error?.status === 403)) {
      throw error;
    }

    return {
      ...baseData,
      aiAgents: normalizeAiAgents(baseData.aiAgents || []),
      appMeta: {
        ...baseData.appMeta,
        source: 'mock-fallback',
        modeLabel: APP_COPY.simulatedText,
        aiProvider: 'mock',
        aiBaseUrl: baseData.appMeta.aiBaseUrl || '',
        aiModel: 'mock',
        appEnv: getEnv('VITE_APP_ENV') || 'development'
      }
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function loginWithCredentials({ role = '', username = '', password = '' } = {}) {
  const payload = {};
  if (role) {
    payload.role = role;
  }
  if (username) {
    payload.username = username;
  }
  if (password) {
    payload.password = password;
  }

  if (!payload.role && !payload.username && !payload.password) {
    throw new Error('登录参数不能为空');
  }

  return requestJson({
    method: 'POST',
    path: '/v1/auth/login',
    body: payload
  });
}

export async function loadCurrentUser({ authToken } = {}) {
  return requestJson({
    method: 'GET',
    path: '/v1/me',
    token: trimEnv(authToken)
  });
}

export async function loadCultureWallAssets({ authToken, role = 'founder', institutionId } = {}) {
  if (!canManageCultureWallRole(role)) {
    return {
      success: true,
      data: {
        cultureWall: normalizeCultureWallFromApi(getMockRuntimeData())
      }
    };
  }

  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        cultureWall: normalizeCultureWallFromApi(getMockRuntimeData())
      }
    };
  }

  const path = buildCultureWallPath({ institutionId });
  const payload = await requestCultureWall({
    method: 'GET',
    path,
    token: trimEnv(authToken),
    role
  });

  return {
    ...payload,
    data: {
      ...(payload?.data || {}),
      cultureWall: normalizeCultureWallFromApi(payload)
    }
  };
}

export async function uploadCultureWallAsset({
  authToken,
  role = 'founder',
  institutionId,
  kind = 'photo',
  file,
  title = '',
  description = '',
  uploader = '当前管理员'
} = {}) {
  if (!file) {
    throw new Error('upload file is required');
  }

  const path = buildCultureWallPath({ institutionId });
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file);
  if (title) {
    form.append('title', title);
  }
  if (description) {
    form.append('description', description);
  }
  if (uploader) {
    form.append('uploader', uploader);
  }

  if (!isApiDataSource()) {
    const local = getMockRuntimeData().cultureWall;
    const fileUrl = URL.createObjectURL(file);
    const now = new Date().toISOString().slice(0, 10);
    const record = {
      id: `${kind}-${Date.now()}`,
      title: title || file.name,
      description: description || `本地${kind === 'video' ? '视频' : '图片'}素材`,
      date: now,
      uploader,
      kind,
      cover: kind === 'video' ? fileUrl : fileUrl,
      src: fileUrl,
      status: '本地预览'
    };

    if (kind === 'photo') {
      return {
        success: true,
        data: {
          cultureWall: {
            ...local,
            photos: [record, ...(local.photos || [])]
          }
        }
      };
    }

    return {
      success: true,
      data: {
        cultureWall: {
          ...local,
          videos: [record, ...(local.videos || [])]
        }
      }
    };
  }

  const payload = await requestMultipart({
    path,
    token: trimEnv(authToken),
    role,
    body: form
  });

  return {
    ...payload,
    data: {
      ...(payload?.data || {}),
      cultureWall: normalizeCultureWallFromApi(payload)
    }
  };
}

export async function deleteCultureWallAsset({
  authToken,
  role = 'founder',
  institutionId,
  assetId
} = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }

  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        cultureWall: normalizeCultureWallFromApi(getMockRuntimeData())
      }
    };
  }

  const payload = await requestCultureWall({
    method: 'DELETE',
    path: '/v1/admin/culture-wall',
    token: trimEnv(authToken),
    role,
    body: {
      institutionId,
      id: assetId
    }
  });

  return {
    ...payload,
    data: {
      ...(payload?.data || {}),
      cultureWall: normalizeCultureWallFromApi(payload)
    }
  };
}

async function requestJson({
  method = 'GET',
  path,
  token,
  role = '',
  body
}) {
  if (!path) {
    throw new Error('Invalid API path');
  }

  const timeoutMs = Number(getEnv('VITE_DATA_TIMEOUT_MS') || 4000);
  const timeout = Math.max(1000, timeoutMs);
  const apiBase = resolveApiBase();
  const roleQuery = trimEnv(token) ? '' : `${path.includes('?') ? '&' : '?'}role=${encodeURIComponent(role || 'platform')}`;
  const headers = {
    Accept: 'application/json',
    ...buildRequestHeaders(token),
    ...(body ? { 'Content-Type': 'application/json' } : {})
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${apiBase}${path}${roleQuery}`, {
      method,
      headers,
      cache: 'no-store',
      signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let detail = '';
      if (contentType.includes('application/json')) {
        const payload = await response.json().catch(() => null);
        detail = payload?.message || payload?.error || payload?.detail || '';
      } else {
        detail = await response.text().catch(() => '');
      }
      const message = `api request failed: ${response.status} ${response.statusText || ''}${detail ? ` - ${String(detail).trim()}` : ''}`.trim();
      const err = new Error(message);
      err.status = response.status;
      err.path = path;
      err.body = detail;
      throw err;
    }

    const payload = await response.json().catch(() => ({ success: true, data: {} }));
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

export async function runAIAgent({ authToken, role = 'founder', action = 'feedback_from_lesson', institutionId = '', payload = {} } = {}) {
  if (!isApiDataSource()) {
    return getMockAIAgentOutput(action, payload);
  }

  const response = await requestJson({
    method: 'POST',
    path: '/v1/ai/agent',
    token: trimEnv(authToken),
    role,
    body: {
      action,
      institutionId: institutionId || '',
      payload
    }
  });

  return response;
}

export async function loadPlatformInstitutions({ authToken } = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      total: organizations.length,
      data: {
        institutions: organizations.map((org) => ({
          ...org,
          id: org.id || org.name
        }))
      }
    };
  }

  const payload = await requestJson({
    method: 'GET',
    path: '/v1/admin/institutions',
    token: trimEnv(authToken),
    role: 'platform'
  });

  return {
    ...payload,
    data: {
      ...(payload?.data || {}),
      institutions: normalizeOrganizationsForUi(payload?.data?.institutions || [])
    }
  };
}

export async function exportPlatformInstitutionsReport({ authToken } = {}) {
  if (!isApiDataSource()) {
    const base = getMockRuntimeData();
    const rows = Array.isArray(base.organizations || []) ? base.organizations : [];
    const content = ['机构名称,套餐,模式,学员,老师,AI已用,AI配额,状态,到期日']
      .concat(rows.map((org) => [
        `${org.name || ''}`,
        `${org.plan || ''}`,
        `${org.planMode || ''}`,
        `${org.students || 0}`,
        `${org.teachers || 0}`,
        `${org.aiUsed || 0}`,
        `${org.aiLimit || 0}`,
        `${org.status || ''}`,
        `${org.expires || ''}`
      ].map((item) => `"${String(item).replace(/"/g, '""')}"`).join(',')));

    return {
      success: true,
      data: {
        fileName: `starmate-platform-report-${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: 'text/csv;charset=utf-8',
        content: content.join('\n')
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: '/v1/admin/institutions-export',
    token: trimEnv(authToken),
    role: 'platform'
  });
}

export async function createPlatformInstitution({ authToken, payload = {} } = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        before: null,
        after: normalizeOrgForUi({
          id: payload.id || `inst_${Date.now()}`,
          name: payload.name || '新机构',
          status: payload.status || 'trial',
          planCode: payload.planCode || 'trial',
          planMode: payload.planMode || 'monthly',
          studentLimit: payload.studentLimit || 50,
          teacherLimit: payload.teacherLimit || 3,
          aiLimit: payload.aiLimitMonthly || 300,
          trialEndsAt: payload.trialEndsAt || ''
        })
      }
    };
  }

  return requestJson({
    method: 'POST',
    path: '/v1/admin/institutions',
    token: trimEnv(authToken),
    role: 'platform',
    body: payload
  });
}

export async function patchInstitution({ authToken, organization, ...payload } = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        before: organization || null,
        after: payload?.after || payload
      }
    };
  }

  const body = {
    ...payload,
    institutionId: payload?.institutionId || organization?.id
  };

  if (!body.institutionId) {
    throw new Error('institutionId is required');
  }

  return requestJson({
    method: 'PATCH',
    path: '/v1/admin/institutions',
    token: trimEnv(authToken),
    role: 'platform',
    body
  });
}

export async function loadInstitutionPermissions({
  authToken,
  role = 'founder',
  institutionId,
  userId
} = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      total: 0,
      data: {
        permissions: []
      }
    };
  }

  const params = new URLSearchParams();
  if (institutionId) {
    params.set('institutionId', `${institutionId}`.trim());
  }
  if (userId) {
    params.set('userId', `${userId}`.trim());
  }

  const query = params.toString();
  const path = `/v1/institution/permissions${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'GET',
    path,
    token: trimEnv(authToken),
    role
  });
}

export async function upsertInstitutionPermission({
  authToken,
  role = 'founder',
  institutionId,
  userId,
  permissionCode
} = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        userId,
        permissionCode,
        granted: true,
        permissions: []
      }
    };
  }

  const params = new URLSearchParams();
  if (institutionId) {
    params.set('institutionId', `${institutionId}`.trim());
  }

  const query = params.toString();
  const path = `/v1/institution/permissions${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'POST',
    path,
    token: trimEnv(authToken),
    role,
    body: {
      userId,
      permissionCode
    }
  });
}

export async function revokeInstitutionPermission({
  authToken,
  role = 'founder',
  institutionId,
  userId,
  permissionCode
} = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        userId,
        permissionCode,
        revoked: true,
        permissions: []
      }
    };
  }

  const params = new URLSearchParams();
  if (institutionId) {
    params.set('institutionId', `${institutionId}`.trim());
  }

  const query = params.toString();
  const path = `/v1/institution/permissions${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'DELETE',
    path,
    token: trimEnv(authToken),
    role,
    body: {
      userId,
      permissionCode
    }
  });
}

export async function loadAIAuditLogs({
  authToken,
  role = 'platform',
  filters = {}
} = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        total: 0,
        limit: 50,
        offset: 0,
        nextOffset: 0,
        items: []
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.institutionId) {
    params.set('institutionId', `${filters.institutionId}`.trim());
  }
  if (filters.action) {
    params.set('action', `${filters.action}`.trim());
  }
  if (filters.userId) {
    params.set('userId', `${filters.userId}`.trim());
  }
  if (filters.clientIp) {
    params.set('clientIp', `${filters.clientIp}`.trim());
  }
  if (filters.startAt) {
    params.set('startAt', `${filters.startAt}`.trim());
  }
  if (filters.endAt) {
    params.set('endAt', `${filters.endAt}`.trim());
  }
  if (filters.decision) {
    params.set('decision', `${filters.decision}`.trim());
  }
  if (filters.role) {
    params.set('role', `${filters.role}`.trim());
  }
  if (filters.limit !== undefined) {
    params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  }
  if (filters.offset !== undefined) {
    params.set('offset', `${toIntSafe(filters.offset, 0)}`);
  }

  const query = params.toString();
  const path = `/v1/admin/ai-audit${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'GET',
    path,
    token: trimEnv(authToken),
    role
  });
}

export async function exportPlatformAIAuditReport({
  authToken,
  role = 'platform',
  filters = {}
} = {}) {
  if (!isApiDataSource()) {
    const fallbackRows = [];
    return {
      success: true,
      data: {
        fileName: `starmate-ai-audit-${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: 'text/csv;charset=utf-8',
        content: '时间,机构,机构ID,角色,用户ID,动作,决策,延迟(ms),Tokens,理由,来源,来源分类,IP,请求参数,响应参数\n' + fallbackRows.join('\n')
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.institutionId) {
    params.set('institutionId', `${filters.institutionId}`.trim());
  }
  if (filters.action) {
    params.set('action', `${filters.action}`.trim());
  }
  if (filters.userId) {
    params.set('userId', `${filters.userId}`.trim());
  }
  if (filters.clientIp) {
    params.set('clientIp', `${filters.clientIp}`.trim());
  }
  if (filters.startAt) {
    params.set('startAt', `${filters.startAt}`.trim());
  }
  if (filters.endAt) {
    params.set('endAt', `${filters.endAt}`.trim());
  }
  if (filters.decision) {
    params.set('decision', `${filters.decision}`.trim());
  }
  if (filters.role) {
    params.set('role', `${filters.role}`.trim());
  }
  if (filters.limit !== undefined) {
    params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  }

  const query = params.toString();
  const path = `/v1/admin/ai-audit-export${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'GET',
    path,
    token: trimEnv(authToken),
    role
  });
}

export async function loadAiUsage({
  authToken,
  role = 'platform',
  filters = {}
} = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        totalInstitutions: 0,
        items: [],
        topUsers: []
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.institutionId) {
    params.set('institutionId', `${filters.institutionId}`.trim());
  }
  if (filters.days !== undefined) {
    params.set('days', `${toIntSafe(filters.days, 30)}`);
  }
  if (filters.includeUsers) {
    params.set('includeUsers', 'true');
  }
  if (filters.startAt) {
    params.set('startAt', `${filters.startAt}`.trim());
  }
  if (filters.endAt) {
    params.set('endAt', `${filters.endAt}`.trim());
  }
  if (filters.limit !== undefined) {
    params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  }
  if (filters.userLimit !== undefined) {
    params.set('userLimit', `${toIntSafe(filters.userLimit, 20)}`);
  }

  const query = params.toString();
  const path = `/v1/admin/ai-usage${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'GET',
    path,
    token: trimEnv(authToken),
    role
  });
}

export async function exportPlatformAiUsageReport({
  authToken,
  role = 'platform',
  filters = {}
} = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        fileName: `starmate-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: 'text/csv;charset=utf-8',
        content: '机构名称,套餐,套餐编码,窗口内AI消耗,月度配额,请求数,最后请求时间,AI来源,来源分类\n'
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.institutionId) {
    params.set('institutionId', `${filters.institutionId}`.trim());
  }
  if (filters.days !== undefined) {
    params.set('days', `${toIntSafe(filters.days, 30)}`);
  }
  if (filters.includeUsers) {
    params.set('includeUsers', 'true');
  }
  if (filters.startAt) {
    params.set('startAt', `${filters.startAt}`.trim());
  }
  if (filters.endAt) {
    params.set('endAt', `${filters.endAt}`.trim());
  }
  if (filters.limit !== undefined) {
    params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  }
  if (filters.userLimit !== undefined) {
    params.set('userLimit', `${toIntSafe(filters.userLimit, 20)}`);
  }

  const query = params.toString();
  const path = `/v1/admin/ai-usage-export${query ? `?${query}` : ''}`;

  return requestJson({
    method: 'GET',
    path,
    token: trimEnv(authToken),
    role
  });
}

function parseLimitOffsetPayload(query = {}) {
  const rawLimit = toIntSafe(query?.limit, 20);
  const rawOffset = toIntSafe(query?.offset, 0);
  return {
    limit: rawLimit > 0 ? rawLimit : 20,
    offset: rawOffset > 0 ? rawOffset : 0
  };
}

function buildPublicLeadFilterQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.institutionId) {
    params.set('institutionId', `${filters.institutionId}`.trim());
  }
  if (filters.limit) {
    params.set('limit', `${toIntSafe(filters.limit, 20)}`);
  }
  if (filters.offset) {
    params.set('offset', `${toIntSafe(filters.offset, 0)}`);
  }
  if (filters.grade) {
    params.set('grade', `${filters.grade}`.trim());
  }
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }
  if (filters.classType) {
    params.set('classType', `${filters.classType}`.trim());
  }

  return params.toString();
}

export async function listPublicCourses({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource()) {
    const source = getMockRuntimeData();
    return {
      success: true,
      data: {
        courses: (source.courses || []).slice(0, toIntSafe(filters.limit, 50)),
        total: source.teacherLessons?.length || 0
      }
    };
  }

  const query = buildPublicLeadFilterQuery(filters);
  const result = await requestJson({
    method: 'GET',
    path: `/v1/public/courses${query ? `?${query}` : ''}`,
    token: trimEnv(authToken)
  });

  return {
    ...result,
    data: {
      ...(result?.data || {}),
      courses: Array.isArray(result?.data?.courses) ? result.data.courses : []
    }
  };
}

export async function createPublicLead({
  authToken,
  institutionId,
  guardianName,
  studentGrade,
  needSummary,
  initialMessage,
  privacyConsent = false,
  aiRecommendation = ''
} = {}) {
  const normalizedInstitutionId = `${institutionId || ''}`.trim();
  const normalizedGuardianName = `${guardianName || ''}`.trim();

  if (!normalizedInstitutionId) {
    throw new Error('institutionId is required');
  }
  if (!normalizedGuardianName) {
    throw new Error('guardianName is required');
  }
  if (!privacyConsent) {
    throw new Error('privacyConsent is required');
  }

  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        lead: {
          id: `lead-${Date.now()}`,
          guardianName: normalizedGuardianName,
          studentGrade,
          status: 'new',
          needSummary,
          privacyConsent: !!privacyConsent
        }
      }
    };
  }

  const payload = {
    institutionId: normalizedInstitutionId,
    guardianName: normalizedGuardianName,
    studentGrade: `${studentGrade || ''}`.trim(),
    needSummary: `${needSummary || ''}`.trim(),
    initialMessage: `${initialMessage || ''}`.trim(),
    privacyConsent: !!privacyConsent,
    aiRecommendation: `${aiRecommendation || ''}`.trim(),
    status: 'new'
  };

  return requestJson({
    method: 'POST',
    path: '/v1/public/leads',
    token: trimEnv(authToken),
    role: 'public',
    body: payload
  });
}

export async function sendLeadAiReply({
  authToken,
  leadId,
  message,
  needSummary = ''
} = {}) {
  const normalizedLeadId = `${leadId || ''}`.trim();
  const normalizedMessage = `${message || ''}`.trim();

  if (!normalizedLeadId) {
    throw new Error('leadId is required');
  }

  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        leadId: normalizedLeadId,
        reply: `AI回复已生成：${String(message || '咨询已收到')}`,
        messageId: `msg-${Date.now()}`,
        mode: 'mock'
      }
    };
  }

  return requestJson({
    method: 'POST',
    path: `/v1/public/leads/${encodeURIComponent(normalizedLeadId)}/ai-reply`,
    token: trimEnv(authToken),
    role: 'public',
    body: {
      message: normalizedMessage,
      needSummary: `${needSummary || ''}`.trim()
    }
  });
}

export async function createTrialBooking({
  authToken,
  leadId,
  institutionId,
  courseId,
  teacherId,
  reservedAt,
  durationMinutes = 60,
  sourceChannel = 'web',
  notes = ''
} = {}) {
  const normalizedLeadId = `${leadId || ''}`.trim();
  const normalizedInstitutionId = `${institutionId || ''}`.trim();
  const normalizedCourseId = `${courseId || ''}`.trim();
  const normalizedReservedAt = `${reservedAt || ''}`.trim();

  if (!normalizedLeadId) {
    throw new Error('leadId is required');
  }
  if (!normalizedInstitutionId) {
    throw new Error('institutionId is required');
  }
  if (!normalizedCourseId) {
    throw new Error('courseId is required');
  }
  if (!normalizedReservedAt) {
    throw new Error('reservedAt is required');
  }

  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        booking: {
          id: `booking-${Date.now()}`,
          leadId: normalizedLeadId,
          courseId: normalizedCourseId,
          reservedAt: normalizedReservedAt,
          durationMinutes,
          status: 'pending'
        },
        leadId: normalizedLeadId,
        status: 'pending'
      }
    };
  }

  return requestJson({
      method: 'POST',
      path: '/v1/public/trial-bookings',
      token: trimEnv(authToken),
      role: 'public',
      body: {
      leadId: normalizedLeadId,
      institutionId: normalizedInstitutionId,
      courseId: normalizedCourseId,
      teacherId: `${teacherId || ''}`.trim(),
      reservedAt: normalizedReservedAt,
      durationMinutes: toIntSafe(durationMinutes, 60),
      sourceChannel: `${sourceChannel || 'web'}`.trim(),
      notes: `${notes || ''}`.trim()
    }
  });
}

export async function loadStudentTodayPath({ authToken } = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    const fallback = getMockRuntimeData();
    return {
      success: true,
      data: {
        tasks: fallback.studentTasks || [],
        studentId: (fallback.students || [])[0]?.id || 's_001',
        institutionId: 'mock-inst'
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: '/v1/student/today-path',
    token: trimEnv(authToken),
    role: 'student'
  });
}

export async function loadStudentReview({ authToken, type = 'summary' } = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        type,
        studentId: 's_001',
        summary: {
          total: 0,
          done: 0,
          doneRate: 0,
          averageScore: 0
        },
        todayTasks: [],
        recent: [],
        items: []
      }
    };
  }

  const safeType = `${type || 'summary'}`.trim() === 'history'
    ? 'history'
    : `${type || 'summary'}`.trim() === 'mistakes'
      ? 'mistakes'
      : 'summary';

  return requestJson({
    method: 'GET',
    path: `/v1/student/review/${safeType}`,
    token: trimEnv(authToken),
    role: 'student'
  });
}

export async function submitStudentVoiceAssess({
  authToken,
  taskId,
  transcript,
  score
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        studentId: 's_001',
        taskId,
        score: toIntSafe(score, 0),
        result: '评分结果：请继续加强音标和语调。',
        record: {
          id: `voice-${Date.now()}`,
          score: toIntSafe(score, 0)
        }
      }
    };
  }

  return requestJson({
    method: 'POST',
    path: '/v1/student/voice-practice/assess',
    token: trimEnv(authToken),
    role: 'student',
    body: {
      taskId: `${taskId || ''}`.trim(),
      transcript: `${transcript || ''}`.trim(),
      score: toIntSafe(score, 0)
    }
  });
}

export async function loadStudentCourses({ authToken } = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        courses: getMockRuntimeData().teacherLessons || []
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: '/v1/student/courses',
    token: trimEnv(authToken),
    role: 'student'
  });
}

export async function loadStudentLessonAccount({ authToken } = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        accounts: [],
        summary: {
          purchased: 0,
          remaining: 0,
          consumed: 0
        },
        studentId: 's_001'
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: '/v1/student/lesson-account',
    token: trimEnv(authToken),
    role: 'student'
  });
}

export async function loadTeacherCourses({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        courses: getMockRuntimeData().teacherLessons || [],
        total: getMockRuntimeData().teacherLessons?.length || 0
      }
    };
  }

  const query = buildPublicLeadFilterQuery({
    grade: filters.grade,
    status: filters.status,
    classType: filters.classType,
    limit: toIntSafe(filters.limit, 50),
    offset: toIntSafe(filters.offset, 0)
  });

  return requestJson({
    method: 'GET',
    path: `/v1/teacher/courses${query ? `?${query}` : ''}`,
    token: trimEnv(authToken),
    role: 'teacher'
  });
}

export async function loadTeacherStudents({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    const studentsList = getMockRuntimeData().students || [];
    return {
      success: true,
      data: {
        students: studentsList,
        total: studentsList.length,
        limit: toIntSafe(filters.limit, 50),
        offset: toIntSafe(filters.offset, 0),
        nextOffset: studentsList.length
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }
  if (filters.q) {
    params.set('q', `${filters.q}`.trim());
  }
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);

  return requestJson({
    method: 'GET',
    path: `/v1/teacher/students?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'teacher'
  });
}

export async function loadTeacherExceptions({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        exceptionCount: 0,
        limit: toIntSafe(filters.limit, 50),
        offset: toIntSafe(filters.offset, 0),
        nextOffset: 0
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }
  if (filters.courseId) {
    params.set('courseId', `${filters.courseId}`.trim());
  }
  if (filters.studentId) {
    params.set('studentId', `${filters.studentId}`.trim());
  }
  if (filters.q) {
    params.set('q', `${filters.q}`.trim());
  }
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);

  return requestJson({
    method: 'GET',
    path: `/v1/teacher/exceptions?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'teacher'
  });
}

export async function submitTeacherAttendance({
  authToken,
  attendance = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
        data: {
          status: attendance.status || 'attended',
          studentId: attendance.studentId,
          courseId: attendance.courseId,
          consumed: true,
          reason: '消课已完成'
        }
    };
  }

  const payload = {
    studentId: `${attendance.studentId || ''}`.trim(),
    courseId: `${attendance.courseId || ''}`.trim(),
    status: `${attendance.status || ''}`.trim() || 'attended',
    note: `${attendance.note || ''}`.trim(),
    sourceLessonId: `${attendance.sourceLessonId || ''}`.trim(),
    attendedAt: `${attendance.attendedAt || ''}`.trim()
  };

  if (!payload.studentId || !payload.courseId) {
    return {
      success: false,
      error: 'studentId and courseId required'
    };
  }

  return requestJson({
    method: 'POST',
    path: '/v1/teacher/exceptions',
    token: trimEnv(authToken),
    role: 'teacher',
    body: payload
  });
}

export async function submitTeacherAttendanceByCourse({
  authToken,
  courseId,
  payload = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        courseId,
        status: payload.status || 'attended',
        summary: {
          totalTargets: 1,
          success: 1,
          failed: 0,
          attendance: [],
          lessons: [
            {
              studentId: payload.studentId || '',
              hoursDeducted: 1,
              beforeRemaining: 10,
              afterRemaining: 9,
              accountId: 'mock-account'
            }
          ],
          shortages: []
        }
      }
    };
  }

  const safeCourseId = `${courseId || ''}`.trim();
  if (!safeCourseId) {
    throw new Error('courseId is required');
  }

  const studentIds = Array.isArray(payload.studentIds)
    ? payload.studentIds.map((item) => `${item || ''}`.trim()).filter(Boolean)
    : `${payload.studentId || ''}`.trim()
      ? [`${payload.studentId}`.trim()]
      : [];

  if (!studentIds.length) {
    throw new Error('studentId or studentIds is required');
  }

  return requestJson({
    method: 'POST',
    path: `/v1/teacher/courses/${encodeURIComponent(safeCourseId)}/attendance`,
    token: trimEnv(authToken),
    role: 'teacher',
    body: {
      studentIds,
      status: `${payload.status || 'attended'}`.trim(),
      note: `${payload.note || ''}`.trim(),
      teacherId: `${payload.teacherId || ''}`.trim(),
      sourceLessonId: `${payload.sourceLessonId || ''}`.trim(),
      attendedAt: `${payload.attendedAt || ''}`.trim()
    }
  });
}

export async function updateInstitutionLesson({
  authToken,
  role = 'teacher',
  institutionId = 'inst-star',
  lessonId,
  patch = {}
} = {}) {
  const safeLessonId = `${lessonId || patch.id || ''}`.trim();
  if (!safeLessonId) {
    throw new Error('lessonId is required');
  }

  const body = { id: safeLessonId };
  if (patch.status !== undefined) {
    body.status = `${patch.status || ''}`.trim();
  }
  if (patch.teacherNote !== undefined) {
    body.teacherNote = `${patch.teacherNote || ''}`.trim();
  }
  if (patch.parentFeedback !== undefined) {
    body.parentFeedback = `${patch.parentFeedback || ''}`.trim();
  }

  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        lesson: {
          id: safeLessonId,
          ...body
        }
      }
    };
  }

  const params = new URLSearchParams();
  const safeInstitutionId = `${institutionId || ''}`.trim();
  if (safeInstitutionId) {
    params.set('institutionId', safeInstitutionId);
  }

  return requestJson({
    method: 'PATCH',
    path: `/v1/institution/lessons${params.toString() ? `?${params.toString()}` : ''}`,
    token: trimEnv(authToken),
    role,
    body
  });
}

export async function submitTeacherIntervention({
  authToken,
  studentId,
  payload = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        studentId,
        intervention: {
          id: `intervention-${Date.now()}`,
          type: payload.interventionType || 'follow',
          action: payload.action || '',
          note: payload.note || '',
          dueAt: payload.dueAt || '',
          priority: payload.priority || 'medium',
          channel: payload.channel || 'teacher'
        }
      }
    };
  }

  const safeStudentId = `${studentId || payload.studentId || ''}`.trim();
  if (!safeStudentId) {
    throw new Error('studentId is required');
  }

  const actionPayload = {
    interventionType: `${payload.interventionType || ''}`.trim(),
    action: `${payload.action || ''}`.trim(),
    note: `${payload.note || ''}`.trim(),
    dueAt: `${payload.dueAt || ''}`.trim(),
    priority: `${payload.priority || 'medium'}`.trim(),
    channel: `${payload.channel || 'teacher'}`.trim()
  };

  if (!actionPayload.interventionType || !actionPayload.action || !actionPayload.note) {
    throw new Error('interventionType, action, note are required');
  }

  return requestJson({
    method: 'POST',
    path: `/v1/teacher/student/${encodeURIComponent(safeStudentId)}/intervention`,
    token: trimEnv(authToken),
    role: 'teacher',
    body: actionPayload
  });
}

export async function assignTeacherExercise({
  authToken,
  studentId,
  payload = {}
} = {}) {
  const safeStudentId = `${studentId || payload.studentId || ''}`.trim();
  if (!safeStudentId) {
    throw new Error('studentId is required');
  }

  const taskPayload = {
    title: `${payload.title || '课后练习'}`.trim(),
    tasks: Array.isArray(payload.tasks)
      ? payload.tasks.map((item) => `${item || ''}`.trim()).filter(Boolean)
      : [],
    lessonId: `${payload.lessonId || ''}`.trim(),
    topic: `${payload.topic || ''}`.trim(),
    difficulty: `${payload.difficulty || 'medium'}`.trim()
  };

  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        studentId: safeStudentId,
        task: {
          id: `exercise-${Date.now()}`,
          taskType: 'exercise',
          title: taskPayload.title,
          status: 'pending',
          payload: taskPayload
        }
      }
    };
  }

  return requestJson({
    method: 'POST',
    path: `/v1/teacher/student/${encodeURIComponent(safeStudentId)}/exercise`,
    token: trimEnv(authToken),
    role: 'teacher',
    body: taskPayload
  });
}

export async function loadParentChildren({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    const list = getMockRuntimeData().students || [];
    return {
      success: true,
      data: {
        children: list.map((item) => ({
          studentId: item.id,
          studentName: item.name,
          grade: item.grade,
          parentName: '家长'
        })),
        total: list.length,
        limit: toIntSafe(filters.limit, 50),
        offset: toIntSafe(filters.offset, 0),
        nextOffset: list.length
      }
    };
  }

  const params = new URLSearchParams();
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  if (filters.offset) {
    params.set('offset', `${toIntSafe(filters.offset, 0)}`);
  }

  return requestJson({
    method: 'GET',
    path: `/v1/parent/children?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'parent'
  });
}

export async function loadChildSummary({
  authToken,
  childId
} = {}) {
  const normalizedChildId = `${childId || ''}`.trim();

  if (!normalizedChildId) {
    throw new Error('childId is required');
  }

  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        student: {
          id: normalizedChildId || 's_001',
          name: '本校学员'
        },
        courses: [],
        lessonAccounts: [],
        paymentRecords: [],
        todayTasks: [],
        recent: [],
        summary: {
          totalTasks: 0,
          doneTasks: 0,
          doneRate: 0,
          averageScore: 0
        }
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: `/v1/parent/child/${encodeURIComponent(normalizedChildId)}/summary`,
    token: trimEnv(authToken),
    role: 'parent'
  });
}

export async function loadChildCourses({
  authToken,
  childId
} = {}) {
  const normalizedChildId = `${childId || ''}`.trim();

  if (!normalizedChildId) {
    throw new Error('childId is required');
  }

  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return { success: true, data: { courses: getMockRuntimeData().teacherLessons || [], total: (getMockRuntimeData().teacherLessons || []).length } };
  }

  return requestJson({
    method: 'GET',
    path: `/v1/parent/child/${encodeURIComponent(normalizedChildId)}/courses`,
    token: trimEnv(authToken),
    role: 'parent'
  });
}

export async function loadChildLessonAccount({
  authToken,
  childId
} = {}) {
  const normalizedChildId = `${childId || ''}`.trim();

  if (!normalizedChildId) {
    throw new Error('childId is required');
  }

  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        records: [],
        summary: { purchased: 0, remaining: 0, consumed: 0 }
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: `/v1/parent/child/${encodeURIComponent(normalizedChildId)}/lesson-account`,
    token: trimEnv(authToken),
    role: 'parent'
  });
}

export async function loadChildPaymentRecords({
  authToken,
  childId,
  status
} = {}) {
  const normalizedChildId = `${childId || ''}`.trim();

  if (!normalizedChildId) {
    throw new Error('childId is required');
  }

  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return { success: true, data: { records: [], total: 0 } };
  }

  const params = new URLSearchParams();
  if (status) {
    params.set('status', `${status}`.trim());
  }

  const query = params.toString();
  return requestJson({
    method: 'GET',
    path: `/v1/parent/child/${encodeURIComponent(normalizedChildId)}/payment-records${query ? `?${query}` : ''}`,
    token: trimEnv(authToken),
    role: 'parent'
  });
}

export async function exportParentChildReport({ authToken, childId = '', institutionId = '' } = {}) {
  const normalizedChildId = `${childId || ''}`.trim();
  const normalizedInstitutionId = `${institutionId || ''}`.trim();

  if (!normalizedChildId) {
    throw new Error('childId is required');
  }

  if (!isApiDataSource()) {
    const content = [
      `Aggie速记英语 · 孩子阶段报告`,
      `孩子ID：${normalizedChildId}`,
      `导出时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`,
      '',
      '提示：当前为本地连接模式导出内容，正式环境请连接 /api/v1/parent/child/{id}/report-export。'
    ].join('\n');

    return {
      success: true,
      data: {
        fileName: `starmate-parent-report-${normalizedChildId}-${new Date().toISOString().slice(0, 10)}.txt`,
        contentType: 'text/plain;charset=utf-8',
        content
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: `/v1/parent/child/${encodeURIComponent(normalizedChildId)}/report-export${normalizedInstitutionId ? `?institutionId=${encodeURIComponent(normalizedInstitutionId)}` : ''}`,
    token: trimEnv(authToken),
    role: 'parent'
  });
}

export async function exportStudentProfileReport({ authToken } = {}) {
  if (!isApiDataSource()) {
    return {
      success: true,
      data: {
        fileName: `starmate-student-profile-${new Date().toISOString().slice(0, 10)}.txt`,
        contentType: 'text/plain;charset=utf-8',
        content: 'Aggie速记英语 · 学生阶段报告（本地连接模式）'
      }
    };
  }

  return requestJson({
    method: 'GET',
    path: '/v1/student/report-export',
    token: trimEnv(authToken),
    role: 'student'
  });
}

export async function loadFounderCockpit({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    const base = getMockRuntimeData();
    return {
      success: true,
      data: {
        studentsCount: 1,
        coursesCount: base.teacherLessons?.length || 0,
        leadsCount: base.founderAlerts?.length || 0,
        leadsByStatus: {},
        leadsTotal: base.founderAlerts?.length || 0,
        attendanceCount: 0,
        attendanceByStatus: {},
        lessonAccountSummary: { totalStudents: 1, totalPurchased: 0, totalRemaining: 0 },
        paymentRecords: { total: 0, byStatus: {} },
        aiUsage: null,
        cockpitAt: new Date().toISOString()
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.courseStatus) {
    params.set('courseStatus', `${filters.courseStatus}`.trim());
  }
  if (filters.leadStatus) {
    params.set('leadStatus', `${filters.leadStatus}`.trim());
  }
  if (filters.paymentStatus) {
    params.set('paymentStatus', `${filters.paymentStatus}`.trim());
  }
  if (filters.startAt) {
    params.set('startAt', `${filters.startAt}`.trim());
  }
  if (filters.endAt) {
    params.set('endAt', `${filters.endAt}`.trim());
  }
  if (filters.aiStartAt) {
    params.set('aiStartAt', `${filters.aiStartAt}`.trim());
  }
  if (filters.aiEndAt) {
    params.set('aiEndAt', `${filters.aiEndAt}`.trim());
  }

  return requestJson({
    method: 'GET',
    path: `/v1/founder/cockpit${params.toString() ? `?${params.toString()}` : ''}`,
    token: trimEnv(authToken),
    role: 'founder'
  });
}

export async function loadFounderCourses({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        courses: getMockRuntimeData().teacherLessons || [],
        total: getMockRuntimeData().teacherLessons?.length || 0,
        limit: toIntSafe(filters.limit, 50),
        offset: toIntSafe(filters.offset, 0),
        nextOffset: getMockRuntimeData().teacherLessons?.length || 0
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.grade) {
    params.set('grade', `${filters.grade}`.trim());
  }
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }
  if (filters.classType) {
    params.set('classType', `${filters.classType}`.trim());
  }
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);

  return requestJson({
    method: 'GET',
    path: `/v1/founder/courses?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'founder'
  });
}

export async function loadFounderPaymentRecords({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return { success: true, data: { records: [], total: 0, limit: 20, offset: 0, nextOffset: 0 } };
  }

  const params = new URLSearchParams();
  params.set('limit', `${toIntSafe(filters.limit, 20)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);
  if (filters.studentId) {
    params.set('studentId', `${filters.studentId}`.trim());
  }
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }

  return requestJson({
    method: 'GET',
    path: `/v1/founder/payment-records?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'founder'
  });
}

export async function loadFounderLessonAccounts({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        summary: {
          totalStudents: 0,
          totalPurchased: 0,
          totalUsed: 0,
          totalRemaining: 0,
          totalHold: 0
        },
        limit: toIntSafe(filters.limit, 50),
        offset: toIntSafe(filters.offset, 0),
        nextOffset: 0
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.studentId) {
    params.set('studentId', `${filters.studentId}`.trim());
  }
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);

  return requestJson({
    method: 'GET',
    path: `/v1/founder/lesson-accounts?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'founder'
  });
}

export async function loadFounderAttendanceRecords({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        limit: toIntSafe(filters.limit, 50),
        offset: toIntSafe(filters.offset, 0),
        nextOffset: 0,
        summary: { total: 0 }
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.studentId) {
    params.set('studentId', `${filters.studentId}`.trim());
  }
  if (filters.courseId) {
    params.set('courseId', `${filters.courseId}`.trim());
  }
  if (filters.startAt) {
    params.set('startAt', `${filters.startAt}`.trim());
  }
  if (filters.endAt) {
    params.set('endAt', `${filters.endAt}`.trim());
  }
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);

  return requestJson({
    method: 'GET',
    path: `/v1/founder/attendance-records?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'founder'
  });
}

export async function loadFounderLeads({
  authToken,
  filters = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    const sample = getMockRuntimeData().leadPipeline || [];
    return {
      success: true,
      data: {
        items: sample.map((item, index) => ({
          id: `${index}`,
          status: 'new',
          guardianName: item.stage,
          student_grade: '五年级',
          need_summary: item.count ? `${item.count}人` : '',
          createdAt: new Date().toISOString()
        })),
        total: sample.length,
        limit: 50,
        offset: 0,
        nextOffset: 0
      }
    };
  }

  const params = new URLSearchParams();
  if (filters.status) {
    params.set('status', `${filters.status}`.trim());
  }
  if (filters.q) {
    params.set('q', `${filters.q}`.trim());
  }
  params.set('limit', `${toIntSafe(filters.limit, 50)}`);
  params.set('offset', `${toIntSafe(filters.offset, 0)}`);

  return requestJson({
    method: 'GET',
    path: `/v1/founder/leads?${params.toString()}`,
    token: trimEnv(authToken),
    role: 'founder'
  });
}

export async function takeoverFounderLead({
  authToken,
  leadId
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return { success: true, data: { leadId, status: 'handling', updated: true } };
  }

  return requestJson({
    method: 'POST',
    path: `/v1/founder/leads/${encodeURIComponent(leadId)}/takeover`,
    token: trimEnv(authToken),
    role: 'founder',
    body: {
      note: 'AI系统生成：已由创始人接管咨询线索'
    }
  });
}

export async function convertFounderLead({
  authToken,
  leadId,
  payload = {}
} = {}) {
  if (!isApiDataSource() || shouldUseDemoFallback(authToken)) {
    return {
      success: true,
      data: {
        leadId,
        studentId: `stu-${Date.now()}`,
        courseId: `${payload.courseId || ''}` || null,
        enrolled: true,
        payment: null
      }
    };
  }

  return requestJson({
    method: 'POST',
    path: `/v1/founder/leads/${encodeURIComponent(leadId)}/convert`,
    token: trimEnv(authToken),
    role: 'founder',
    body: {
      studentName: `${payload.studentName || ''}`.trim(),
      grade: `${payload.grade || ''}`.trim(),
      teacherId: `${payload.teacherId || ''}`.trim(),
      courseId: `${payload.courseId || ''}`.trim(),
      enroll: payload.enroll === false ? '0' : '1',
      paymentAmountCents: toIntSafe(payload.paymentAmountCents, 0),
      paymentMethod: `${payload.paymentMethod || ''}`.trim(),
      paidAt: `${payload.paidAt || ''}`.trim(),
      paymentStatus: `${payload.paymentStatus || ''}`.trim() || 'paid',
      currency: `${payload.currency || ''}`.trim() || 'CNY',
      orderNo: `${payload.orderNo || ''}`.trim(),
      notes: `${payload.notes || ''}`.trim(),
      guardianPhone: `${payload.guardianPhone || ''}`.trim(),
      guardianWechat: `${payload.guardianWechat || ''}`.trim(),
      renewalRisk: toIntSafe(payload.renewalRisk, 0)
    }
  });
}
