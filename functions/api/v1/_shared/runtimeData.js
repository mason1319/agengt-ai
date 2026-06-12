import {
  APP_COPY,
  MENU_CONFIG,
  ORG_ACTIONS_BY_STATUS,
  ORG_STATUS_DEFAULTS,
  aiAgents,
  billingPlans,
  founderAlerts,
  leadPipeline,
  organizations,
  cultureWall,
  parentReports,
  students,
  teacherLessons
} from './seedData.js';
import {
  fetchInstitutionById,
  fetchOrganizationsForPlatform,
  fetchPlatformSummary,
  fetchStudentsByInstitution,
  fetchStudentsByTeacher
} from './dbLayer.js';

const clone = (value) => JSON.parse(JSON.stringify(value));
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const AI_ICON_MAP = {
  BookOpenCheck: 'BookOpenCheck',
  Bot: 'Bot',
  CreditCard: 'CreditCard',
  MessageCircleHeart: 'MessageCircleHeart',
  ShieldAlert: 'ShieldAlert',
  Sparkles: 'Sparkles',
  TrendingUp: 'TrendingUp',
  WandSparkles: 'WandSparkles'
};

const DEMO_STUDENT_TASKS = [
  { id: 't1', title: '单词星球 12词', done: true },
  { id: 't2', title: '语法关卡 一般过去时', done: true },
  { id: 't3', title: '阅读闯关 1篇', done: false },
  { id: 't4', title: '错题复活 6题', done: false }
];

const basePayload = {
  appCopy: APP_COPY,
  menuConfig: MENU_CONFIG,
  founderAlerts,
  leadPipeline,
  teacherLessons,
  students,
  parentReports,
  organizations,
  cultureWall: {
    videos: cultureWall.videos.map((item) => ({ ...item })),
    photos: cultureWall.photos.map((item) => ({ ...item })),
    teachers: cultureWall.teachers.map((item) => ({ ...item })),
    feedback: cultureWall.feedback.map((item) => ({ ...item }))
  },
  billingPlans,
  aiAgents: aiAgents.map((agent) => ({
    ...agent,
    icon: aiIconMap(agent.icon)
  })),
  orgActionsByStatus: ORG_ACTIONS_BY_STATUS,
  orgStatusDefaults: ORG_STATUS_DEFAULTS,
  studentTasks: DEMO_STUDENT_TASKS
};

function aiIconMap(icon) {
  if (typeof icon === 'string') {
    return icon;
  }

  if (icon && typeof icon === 'function' && icon.name && AI_ICON_MAP[icon.name]) {
    return icon.name;
  }

  return 'Sparkles';
}

export const DEMO_TOKENS = {
  founder: 'starmate_founder_demo_token',
  teacher: 'starmate_teacher_demo_token',
  parent: 'starmate_parent_demo_token',
  student: 'starmate_student_demo_token',
  platform: 'starmate_platform_demo_token'
};

export const DEMO_USERS = [
  {
    id: 'u_platform_01',
    username: 'platform',
    password: 'Platform@123',
    role: 'platform',
    name: '平台管理员',
    institutionId: 'platform'
  },
  {
    id: 'u_founder_01',
    username: 'founder',
    password: 'Founder@123',
    role: 'founder',
    name: '星伴英语本部',
    institutionId: 'inst-star'
  },
  {
    id: 'u_teacher_01',
    username: 'teacher',
    password: 'Teacher@123',
    role: 'teacher',
    name: '王老师',
    institutionId: 'inst-star',
    teacherStudentIds: ['s_001', 's_002', 's_003']
  },
  {
    id: 'u_parent_01',
    username: 'parent',
    password: 'Parent@123',
    role: 'parent',
    name: '小宇家长',
    institutionId: 'inst-star',
    childId: 's_001',
    childName: '小宇'
  },
  {
    id: 'u_student_01',
    username: 'student',
    password: 'Student@123',
    role: 'student',
    name: '小宇',
    institutionId: 'inst-star',
    studentId: 's_001',
    studentName: '小宇'
  }
];

const DEMO_LOGIN_ENV_KEY = 'ALLOW_DEMO_LOGIN';

function getBooleanEnv(value) {
  return `${value || ''}`.trim().toLowerCase() === 'true';
}

function isDemoLoginEnabled(env = {}) {
  return getBooleanEnv(env?.[DEMO_LOGIN_ENV_KEY]);
}

const ROLE_SCOPE = {
  founder: [
    'appCopy',
    'menuConfig',
    'founderAlerts',
    'leadPipeline',
    'teacherLessons',
    'students',
    'parentReports',
    'cultureWall',
    'billingPlans',
    'aiAgents',
    'platformSummary'
  ],
  teacher: [
    'appCopy',
    'menuConfig',
    'teacherLessons',
    'students',
    'cultureWall',
    'aiAgents',
    'platformSummary'
  ],
  parent: [
    'appCopy',
    'menuConfig',
    'students',
    'parentReports',
    'cultureWall',
    'platformSummary',
    'aiAgents'
  ],
  student: [
    'appCopy',
    'menuConfig',
    'students',
    'cultureWall',
    'studentTasks',
    'aiAgents',
    'platformSummary'
  ],
  platform: [
    'appCopy',
    'menuConfig',
    'organizations',
    'billingPlans',
    'cultureWall',
    'aiAgents',
    'orgActionsByStatus',
    'orgStatusDefaults',
    'platformSummary'
  ]
};

export const PLATFORM_SUMMARY = {
  currentPlanName: '标准版',
  studentUsageText: '326 / 500 学员，AI剩余 7,840 次'
};

const APP_DB_FALLBACK_ORGANIZATION = 'inst-star';

export const FIELD_TO_ROLE_PERMISSION = {
  parentPhone: ['founder', 'platform'],
  parentWechat: ['founder', 'platform'],
  students: ['founder', 'teacher', 'parent', 'student', 'platform'],
  aiAgents: ['founder', 'teacher', 'parent', 'student', 'platform'],
  cultureWall: ['founder', 'teacher', 'parent', 'student', 'platform'],
  organizations: ['founder', 'platform'],
  billingPlans: ['founder', 'platform']
};

const DEFAULT_JWT_TTL_SECONDS = 60 * 60 * 24;

function b64UrlEncode(value) {
  const bytes = (() => {
    if (value instanceof Uint8Array) {
      return value;
    }

    if (typeof value === 'string') {
      return textEncoder.encode(value);
    }

    return textEncoder.encode(JSON.stringify(value));
  })();

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64UrlDecodeToBytes(value) {
  const normalized = `${value}`.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function b64UrlDecode(value) {
  return textDecoder.decode(b64UrlDecodeToBytes(value));
}

function bytesToHex(bytes) {
  const target = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...target].map((item) => item.toString(16).padStart(2, '0')).join('');
}

function normalizeStoredPasswordHash(raw = '') {
  const value = `${raw || ''}`.trim();
  if (!value) {
    return '';
  }

  if (value.startsWith('sha256:')) {
    return value;
  }

  return `plain:${value}`;
}

async function hashPasswordSha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(`${value || ''}`));
  return `sha256:${bytesToHex(new Uint8Array(digest))}`;
}

async function matchPasswordHash(storedHash, inputPassword) {
  const normalized = normalizeStoredPasswordHash(storedHash);

  if (normalized.startsWith('plain:')) {
    return normalized.slice(6) === `${inputPassword || ''}`;
  }

  const expected = normalized.slice(7);
  const actual = await hashPasswordSha256(inputPassword);
  return expected === actual.slice(7);
}

export async function getSecretFromEnv(env) {
  return (env && env.JWT_SECRET) || 'starmate_local_secret_replace_before_prod';
}

function getRawSecretBytes(secret) {
  return textEncoder.encode(secret);
}

export async function signJwtPayload(payload, secret) {
  const plain = JSON.stringify(payload);
  const unsigned = b64UrlEncode(plain);
  const key = await crypto.subtle.importKey(
    'raw',
    getRawSecretBytes(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign', 'verify']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(unsigned)
  );

  const sig = b64UrlEncode(new Uint8Array(signature));
  return `${unsigned}.${sig}`;
}

export async function verifyJwtToken(token, secret) {
  const [unsigned, sig] = `${token}`.split('.');
  if (!unsigned || !sig) {
    return null;
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      getRawSecretBytes(secret),
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign', 'verify']
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64UrlDecodeToBytes(sig),
      textEncoder.encode(unsigned)
    );

    if (!valid) {
      return null;
    }

    const json = b64UrlDecode(unsigned);
    const payload = JSON.parse(json);

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function buildTokenPayload(role, user, ttlSeconds = DEFAULT_JWT_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const hydratedUser = mergeSeedIdentityFields(user);
  return {
    sub: hydratedUser.id,
    role,
    institutionId: hydratedUser.institutionId || null,
    childId: hydratedUser.childId || null,
    childName: hydratedUser.childName || null,
    studentId: hydratedUser.studentId || null,
    studentName: hydratedUser.studentName || null,
    name: hydratedUser.name,
    iat: now,
    exp: now + ttlSeconds
  };
}

export function tokenToRole(token = '') {
  const direct = Object.entries(DEMO_TOKENS).find((entry) => entry[1] === token);
  return direct ? direct[0] : null;
}

export function normalizeRoleInput(value = '') {
  const role = `${value}`.toLowerCase();
  return ROLE_SCOPE[role] ? role : null;
}

export function getDemoUserByRole(role) {
  const normalized = normalizeRoleInput(role);
  return DEMO_USERS.find((user) => user.role === normalized) || null;
}

export async function parseRoleFromRequest(request, env) {
  const context = await parseAuthContext(request, env);
  return context?.role || null;
}

export const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders
  });
}

function normalizePayload(data = {}) {
  return {
    ...clone(data),
    platformSummary: { ...PLATFORM_SUMMARY },
    students: Array.isArray(data.students)
      ? data.students
      : clone(students),
    parentReports: Array.isArray(data.parentReports)
      ? data.parentReports
      : clone(parentReports),
    aiAgents: (data.aiAgents || []).map((agent) => ({
      ...agent,
      icon: aiIconMap(agent.icon)
    }))
  };
}

export function buildBootstrapData(overrides = {}) {
  const payload = normalizePayload(basePayload);

  return {
    ...payload,
    ...overrides
  };
}

export function getRoleData(role = 'founder', overrides = {}) {
  const payload = normalizePayload(basePayload);
  const roleKeys = ROLE_SCOPE[role] || ROLE_SCOPE.founder;
  const data = roleKeys.reduce((acc, key) => {
    if (payload[key] !== undefined) {
      acc[key] = payload[key];
    }

    return acc;
  }, {});

  return {
    ...data,
    ...overrides
  };
}

export function filterByRoleData(role, baseData = {}) {
  return getRoleData(role, baseData);
}

function matchStudentByScope(studentList = [], scopeIds = []) {
  const keySet = new Set(
    scopeIds
      .map((item) => `${item}`.trim())
      .filter(Boolean)
  );

  if (!keySet.size) {
    return [];
  }

  const found = [];
  const seen = new Set();
  const studentIndexById = new Map();
  const studentIndexByName = new Map();

  studentList.forEach((student) => {
    if (student?.id !== undefined && student?.id !== null) {
      studentIndexById.set(`${student.id}`, student);
    }
    if (student?.name) {
      studentIndexByName.set(`${student.name}`, student);
    }
  });

  keySet.forEach((key) => {
    const target = studentIndexById.get(key) || studentIndexByName.get(key);
    if (!target) {
      return;
    }

    const identity = `${target.id || target.name}`;
    if (!seen.has(identity)) {
      seen.add(identity);
      found.push(target);
    }
  });

  return found;
}

function fallbackMatchStudent(studentList = [], id, name) {
  const byId = studentList.find((student) => `${student?.id || ''}` === `${id || ''}`);
  if (byId) {
    return byId;
  }

  if (name) {
    const byName = studentList.find((student) => student?.name === name);
    if (byName) {
      return byName;
    }
  }

  const byNameAsId = studentList.find((student) => student?.name === `${id || ''}`);
  if (byNameAsId) {
    return byNameAsId;
  }

  return studentList[0] || null;
}

async function safeUserFromDb(env, username, password) {
  if (!env?.DB) {
    return null;
  }

  try {
    const row = await env.DB.prepare(
      'SELECT id, username, role, name, institution_id, password_hash FROM users WHERE username = ?1 LIMIT 1'
    )
      .bind(username)
      .first();

    if (!row) {
      return null;
    }

    const match = await matchPasswordHash(row.password_hash, password);
    if (!match) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      role: row.role,
      name: row.name,
      institutionId: row.institution_id
    };
  } catch {
    return null;
  }
}

function applyDevelopmentSeedFallback(user, env) {
  const isLocalMode = `${env?.APP_ENV || ''}`.trim().toLowerCase() === 'development';
  if (!isLocalMode || !user?.role || !user?.username) {
    return user;
  }

  const seedUser = DEMO_USERS.find((candidate) =>
    candidate.role === user.role && candidate.username === user.username
  );

  if (!seedUser) {
    return user;
  }

  return {
    ...user,
    childId: user.childId || seedUser.childId || null,
    childName: user.childName || seedUser.childName || null,
    studentId: user.studentId || seedUser.studentId || null,
    studentName: user.studentName || seedUser.studentName || null
  };
}

function mergeSeedIdentityFields(user = {}) {
  if (!user?.role) {
    return user;
  }

  const seedUser = DEMO_USERS.find((candidate) =>
    (user.username && candidate.username === user.username)
    || (user.id && candidate.id === user.id)
    || (candidate.role === user.role && candidate.name === user.name)
  );

  if (!seedUser) {
    return user;
  }

  return {
    ...user,
    childId: user.childId || seedUser.childId || null,
    childName: user.childName || seedUser.childName || null,
    studentId: user.studentId || seedUser.studentId || null,
    studentName: user.studentName || seedUser.studentName || null
  };
}

export async function resolveUserByCredential(env, username, password) {
  const dbUser = await safeUserFromDb(env, username, password);
  if (dbUser) {
    return applyDevelopmentSeedFallback(dbUser, env);
  }

  const isLocalMode = `${env?.APP_ENV || ''}`.trim().toLowerCase() === 'development';
  const isDemoFallbackEnabled = isDemoLoginEnabled(env) || isLocalMode;

  if (!isDemoFallbackEnabled) {
    return null;
  }

  const seedUser = DEMO_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!seedUser) {
    return null;
  }

  return {
    id: seedUser.id,
    username: seedUser.username,
    role: seedUser.role,
    name: seedUser.name,
    institutionId: seedUser.institutionId
  };
}

export async function parseAuthContext(request, env, options = {}) {
  const { headers, url } = request;

  const allowRoleHint = options?.allowRoleHint === true;

  const bearer = headers.get('authorization') || headers.get('Authorization') || '';
  const tokenFromBearer = /^Bearer\s+/i.test(bearer)
    ? bearer.replace(/^Bearer\s+/i, '').trim()
    : '';

  const parsed = new URL(url);
  const tokenFromQuery = parsed.searchParams.get('token') || '';
  const token = tokenFromBearer || tokenFromQuery;

  if (token) {
    if (isDemoLoginEnabled(env)) {
      const staticRole = tokenToRole(token);

      if (staticRole) {
        const demoUser = getDemoUserByRole(staticRole);

        return {
          token,
          role: staticRole,
          user: {
            id: `demo-${staticRole}`,
            role: staticRole,
            name: staticRole === 'platform' ? '平台管理员' : `demo-${staticRole}`,
            institutionId: demoUser?.institutionId || null,
            childId: demoUser?.childId,
            childName: demoUser?.childName,
            studentId: demoUser?.studentId
          }
        };
      }
    }

    const secret = await getSecretFromEnv(env);
    const payload = await verifyJwtToken(token, secret);
    if (payload && payload.role && payload.sub) {
      const hydratedUser = mergeSeedIdentityFields({
        id: payload.sub,
        role: payload.role,
        name: payload.name,
        institutionId: payload.institutionId,
        childId: payload.childId,
        childName: payload.childName,
        studentId: payload.studentId,
        studentName: payload.studentName
      });
      return {
        token,
        role: payload.role,
        user: hydratedUser
      };
    }
  }

  if (!allowRoleHint) {
    return null;
  }

  const roleFromHeader = headers.get('x-demo-role');
  if (roleFromHeader) {
    const direct = normalizeRoleInput(roleFromHeader);
    if (direct) {
      return {
        role: direct
      };
    }
  }

  const roleFromQuery = normalizeRoleInput(parsed.searchParams.get('role') || '');
  if (roleFromQuery) {
    return {
      role: roleFromQuery
    };
  }

  return null;
}

export async function issueSessionToken(env, role, user) {
  const secret = await getSecretFromEnv(env);
  const payload = buildTokenPayload(role, user);
  return signJwtPayload(payload, secret);
}

function computeStudentUsageText(institution) {
  if (!institution) {
    return '0 / 0 学员，AI剩余 0 次';
  }

  return `${institution.students || 0} / ${institution.limitStudents || 0} 学员，AI剩余 ${Math.max(
    0,
    (institution.aiLimit || 0) - (institution.aiUsed || 0)
  )} 次`;
}

function pickInstitutionId(context = {}) {
  return (
    context.user?.institutionId ||
    context.institutionId ||
    APP_DB_FALLBACK_ORGANIZATION
  );
}

function maskContactValue(value = '') {
  const text = `${value || ''}`.trim();
  if (!text || text.includes('***')) {
    return text || '已脱敏';
  }

  if (text.length <= 8) {
    return '****';
  }

  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function maskStudentContactForTeacher(student = {}) {
  if (!student || typeof student !== 'object') {
    return student;
  }

  if (!student.parent || typeof student.parent !== 'object') {
    return student;
  }

  return {
    ...student,
    parent: {
      ...student.parent,
      name: student.parent.name || '已脱敏',
      phoneMasked: maskContactValue(student.parent.phoneMasked),
      wechatMasked: student.parent.wechatMasked ? '已脱敏' : '已脱敏'
    }
  };
}

function maskStudentsForRole(students = [], role = '') {
  if (!Array.isArray(students)) {
    return [];
  }

  if (role !== 'teacher') {
    return students;
  }

  return students.map((student) => maskStudentContactForTeacher(student));
}

async function buildDbScopedPayload(role, context = {}, env) {
  const db = env?.DB;
  if (!db) {
    return null;
  }

  if (role === 'platform') {
    const [organizationsRaw, summaryRaw] = await Promise.all([
      fetchOrganizationsForPlatform(db),
      fetchPlatformSummary(db)
    ]);
    const organizations = Array.isArray(organizationsRaw) ? organizationsRaw : [];
    const summary = summaryRaw || {};

    return {
      organizations,
      platformSummary: {
        currentPlanName: '平台汇总',
        studentUsageText: `${summary.studentTotal || 0} 学员，${summary.institutionTotal || 0} 机构，${summary.activeCount || 0} 家活跃`
      }
    };
  }

  const institutionId = pickInstitutionId(context);
  const [institutionRaw, studentsByDbRaw] = await Promise.all([
    fetchInstitutionById(db, institutionId),
    role === 'teacher'
      ? fetchStudentsByTeacher(db, institutionId, context.user?.id, 300)
      : fetchStudentsByInstitution(db, institutionId, 300)
  ]);

  const studentsByDb = Array.isArray(studentsByDbRaw) ? studentsByDbRaw : [];
  const institution = institutionRaw || {};

  if (role === 'teacher') {
    const safeStudents = studentsByDb.length ? studentsByDb : [];

    return {
      students: maskStudentsForRole(safeStudents, role),
      organizations: institution ? [institution] : [],
      platformSummary: {
        currentPlanName: institution.plan || '体验版',
        studentUsageText: computeStudentUsageText(institution)
      }
    };
  }

  if (role === 'parent' || role === 'student') {
    const targetStudent = studentsByDb.find(
      (item) =>
        item.id === context.user?.childId ||
        item.id === context.user?.studentId
    );

    const child = targetStudent || studentsByDb[0] || null;

    return {
      students: child ? maskStudentsForRole([child], role) : [],
      platformSummary: {
        currentPlanName: institution.plan || '体验版',
        studentUsageText: computeStudentUsageText(institution)
      }
    };
  }

    return {
      students: maskStudentsForRole(studentsByDb, role),
      platformSummary: {
        currentPlanName: institution.plan || '体验版',
        studentUsageText: computeStudentUsageText(institution)
      }
  };
}

export async function buildRoleScopedPayload(role, env, context = {}) {
  const baseData = normalizePayload(basePayload);
  const roleData = getRoleData(role, context.overrides || {});
  const result = { ...roleData };

  const dbPayload = await buildDbScopedPayload(role, context, env);
  if (dbPayload) {
    return {
      ...result,
      ...dbPayload,
      appCopy: {
        ...baseData.appCopy,
        ...(result.appCopy || {}),
        simulatedText: '数据库实时数据'
      }
    };
  }

  if (role === 'platform') {
    return result;
  }

  if (role === 'teacher') {
    const studentScope = baseData.students || [];
    const teacher = DEMO_USERS.find((u) => u.role === role);
    const scopeIds = teacher?.teacherStudentIds || [];
    const filteredStudents = scopeIds.length
      ? matchStudentByScope(studentScope, scopeIds)
      : studentScope;

    const safeStudents = filteredStudents.length ? filteredStudents : studentScope;

    return {
      ...result,
      students: maskStudentsForRole(safeStudents, role),
      parentReports: baseData.parentReports.filter((report) =>
        safeStudents.some((stu) => report.student === stu.name)
      )
    };
  }

  if (role === 'parent') {
    const parentUser = DEMO_USERS.find((u) => u.role === 'parent');
    const child = parentUser
      ? fallbackMatchStudent(baseData.students, parentUser.childId, parentUser.childName)
      : baseData.students?.[0];

    return {
      ...result,
      students: child ? [child] : []
    };
  }

  if (role === 'student') {
    const studentUser = DEMO_USERS.find((u) => u.role === 'student');
    const student = studentUser
      ? fallbackMatchStudent(baseData.students, studentUser.studentId, studentUser.studentName)
      : baseData.students?.[0];

    return {
      ...result,
      students: student ? [student] : []
    };
  }

  if (role === 'founder') {
    return result;
  }

  return result;
}
