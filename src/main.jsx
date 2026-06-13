import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  DatabaseZap,
  Image as ImageIcon,
  EyeOff,
  Flame,
  Filter,
  Gift,
  GraduationCap,
  Headphones,
  Lock,
  Mic,
  FileText,
  Play,
  LayoutDashboard,
  MessageCircleHeart,
  Puzzle,
  Rocket,
  ShieldCheck,
  Trophy,
  Video,
  Sparkles,
  Camera,
  Star,
  TrendingUp,
  Users,
  WalletCards,
  WandSparkles
} from 'lucide-react';
import './styles.css';
import AppShell from './layouts/AppShell';
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';
import AggieMascotArt from './components/AggieMascotArt';
import MetricCard from './components/MetricCard';
import PanelTitle from './components/PanelTitle';
import {
  formatCurrencyCents,
  normalizeCourseClassType,
  normalizeCourseFee
} from './utils/formatters';
import {
  getCourseDisplay,
  normalizeCourseRules,
  normalizeCourseTime
} from './utils/courseFormatters';
import {
  ACHIEVEMENT_ITEMS,
  COURSE_PATH_STEPS,
  COURSE_SKILL_GOALS,
  PRACTICE_ARENAS,
  PRACTICE_MODULES,
  PROFILE_SKILL_RADAR,
  WEEKLY_STREAK
} from './data/learningContent';
import {
  APP_COPY,
  MENU_CONFIG,
  ORG_ACTIONS_BY_STATUS,
  ORG_STATUS,
  ORG_STATUS_DEFAULTS,
  UI_COPY
} from './config/appConfig';
import {
  buildInstitutionPatchPayload,
  getMockRuntimeData,
  isApiDataSource,
  listPublicCourses,
  loadCurrentUser,
  loadPlatformInstitutions,
  exportPlatformInstitutionsReport,
  createPlatformInstitution,
  loadAIAuditLogs,
  exportPlatformAIAuditReport,
  loadAiUsage,
  exportPlatformAiUsageReport,
  loadRuntimeData,
  createPublicLead,
  sendLeadAiReply,
  createTrialBooking,
  loadStudentTodayPath,
  loadStudentReview,
  submitStudentPathCompletion,
  submitStudentPracticeReview,
  submitStudentVoiceAssess,
  loadStudentCourses,
  loadStudentLessonAccount,
  loadTeacherCourses,
  loadTeacherStudents,
  loadTeacherExceptions,
  submitTeacherAttendanceByCourse,
  updateInstitutionLesson,
  submitTeacherIntervention,
  assignTeacherExercise,
  loadParentChildren,
  loadChildSummary,
  loadChildCourses,
  loadChildLessonAccount,
  loadChildPaymentRecords,
  loadChildMessages,
  createChildMessage,
  loadFounderCockpit,
  loadFounderCourses,
  loadFounderPaymentRecords,
  loadFounderLessonAccounts,
  loadFounderAttendanceRecords,
  adjustFounderLessonAccount,
  loadFounderLeads,
  takeoverFounderLead,
  convertFounderLead,
  createFounderCourse,
  updateFounderCourse,
  exportParentChildReport,
  exportStudentProfileReport,
  loginWithCredentials,
  runAIAgent,
  uploadCultureWallAsset,
  loadCultureWallAssets,
  normalizeOrganizationsForUi,
  normalizeOrgForUi,
  patchInstitution
} from './services/runtimeDataService';

const FALLBACK_DATA = getMockRuntimeData();
function trimEnv(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getInitRoleFromEnv() {
  const role = trimEnv(import.meta.env?.VITE_INITIAL_ROLE).toLowerCase();
  return role === 'founder' || role === 'teacher' || role === 'parent' || role === 'student' || role === 'platform'
    ? role
    : 'founder';
}

function getInitTokenFromUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  return trimEnv(url.searchParams.get('token'));
}

function getInitRoleFromUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  const role = trimEnv(url.searchParams.get('role')).toLowerCase();
  return role === 'founder' || role === 'teacher' || role === 'parent' || role === 'student' || role === 'platform'
    ? role
    : '';
}

const AUTH_SESSION_KEY = 'starmate_auth_session_v1';
const ROLE_OPTIONS = [
  { value: 'platform', label: '平台管理员' },
  { value: 'founder', label: '机构创始人' },
  { value: 'teacher', label: '老师' },
  { value: 'parent', label: '家长' },
  { value: 'student', label: '学生' }
];

function normalizeRoleInput(value) {
  const role = `${value || ''}`.trim().toLowerCase();
  return role === 'founder' || role === 'teacher' || role === 'parent' || role === 'student' || role === 'platform'
    ? role
    : '';
}

function getAdminPathState() {
  if (typeof window === 'undefined') {
    return { path: '/', isAdminRoute: false };
  }

  const path = window.location.pathname || '/';
  const isAdminRoute = path === '/admin' || path === '/admin/' || path.startsWith('/admin/');
  return { path, isAdminRoute };
}

function safeJsonParse(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadSavedSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  const payload = safeJsonParse(raw);
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const token = `${payload.token || ''}`.trim();
  const user = payload.user && typeof payload.user === 'object' ? payload.user : null;

  if (!token || !user?.role) {
    return null;
  }

  return {
    token,
    user: {
      ...user,
      role: normalizeRoleInput(user.role)
    }
  };
}

function saveSessionToStorage(token, user) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      token,
      user,
      updatedAt: new Date().toISOString()
    })
  );
}

function clearSessionFromStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

function stripTokenFromUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.get('token')) {
    return;
  }

  url.searchParams.delete('token');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function getRoleLabel(role = '') {
  const target = ROLE_OPTIONS.find((item) => item.value === normalizeRoleInput(role));
  return target?.label || role || '未知身份';
}

function formatCents(value = 0) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '¥0.00';
  }
  return `¥${(amount / 100).toFixed(2)}`;
}

function isNotFoundApiError(error) {
  const message = `${error?.message || ''}`.toLowerCase();
  return message.includes('404') && message.includes('api request failed');
}

function AdminLoginPage({
  onSubmit,
  busy,
  errorMessage,
  defaultRole,
  forceAccountMode = false
}) {
  const [loginMode, setLoginMode] = useState(forceAccountMode ? 'account' : 'demo');
  const [role, setRole] = useState(normalizeRoleInput(defaultRole) || 'platform');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const roleOptions = ROLE_OPTIONS;

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (busy) {
      return;
    }

    try {
      if (loginMode === 'account') {
        if (!username.trim() || !password.trim()) {
          setLocalError('请输入账号与密码');
          return;
        }
        setLocalError('');
        await onSubmit({
          role,
          username: username.trim(),
          password: password.trim()
        });
        return;
      }

      await onSubmit({ role });
    } catch (error) {
      setLocalError(error?.message || '登录失败');
    }
  };

  return (
    <main className="admin-login-screen">
      <section className="admin-login-card">
        <div className="admin-login-kicker">Aggie速记英语 管理端</div>
        <h1><WandSparkles size={28} /> 管理登录</h1>
        <p>登录后将进入 /admin 管理首页，支持预置角色登录与正式账号登录。</p>
        <div className="admin-login-strip">
          <span>平台总览</span>
          <span>机构管理</span>
          <span>机构方案</span>
          <span>AI 审计</span>
        </div>

        {forceAccountMode ? (
          <p>当前为真实登录模式，请使用账号密码登录</p>
        ) : null}

        {forceAccountMode ? null : (
          <div className="admin-login-switch">
            <button
              className={loginMode === 'demo' ? 'active' : ''}
              type="button"
              onClick={() => setLoginMode('demo')}
              disabled={busy}
            >
              预置角色登录
            </button>
            <button
              className={loginMode === 'account' ? 'active' : ''}
              type="button"
              onClick={() => setLoginMode('account')}
              disabled={busy}
            >
              账号密码登录
            </button>
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>
            <span>角色</span>
            <select value={role} onChange={(evt) => setRole(normalizeRoleInput(evt.target.value))} disabled={busy}>
              {roleOptions.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {loginMode === 'account' ? (
            <>
              <label>
                <span>用户名</span>
                <input value={username} onChange={(evt) => setUsername(evt.target.value)} disabled={busy} />
              </label>
              <label>
                <span>密码</span>
                <input type="password" value={password} onChange={(evt) => setPassword(evt.target.value)} disabled={busy} />
              </label>
            </>
          ) : null}

          <button className="admin-login-btn" type="submit" disabled={busy}>
            {busy ? '登录中...' : '立即进入 /admin'}
          </button>
        </form>

        {(localError || errorMessage) ? <div className="admin-login-error">{localError || errorMessage}</div> : null}
      </section>
    </main>
  );
}

const iconRegistry = {
  AlertTriangle,
  BookOpenCheck,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  DatabaseZap,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  MessageCircleHeart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  WalletCards,
  WandSparkles
};
function isApiMode() {
  return (trimEnv(import.meta.env?.VITE_DATA_SOURCE) || 'api').toLowerCase() === 'api';
}

function getAIAgentSourceLabel(payload = {}) {
  const source = `${payload?.source || payload?.output?.source || 'provider'}`.trim();
  const providerFallback = `${payload?.providerFallback || payload?.output?.providerFallback || ''}`.trim();

  if (source === 'mock' || source === 'mock-fallback') {
    return '备用模型';
  }
  if (providerFallback) {
    return `备用模型（${providerFallback}）`;
  }
  return '真实模型';
}

function getAIAuditSourceLabel(sourceText = '') {
  const source = `${sourceText || ''}`.trim();
  if (!source) {
    return '—';
  }
  const sourceLower = source.toLowerCase();
  if (
    sourceLower === 'mock'
    || sourceLower === 'mock-fallback'
    || sourceLower === 'mock-fallback-v2'
    || sourceLower.includes('mock')
    || sourceLower.includes('模拟')
    || sourceLower.includes('simulation')
  ) {
    return '备用模型';
  }
  if (
    sourceLower === 'provider'
    || sourceLower === 'provider-api'
    || sourceLower.startsWith('provider-')
    || sourceLower.includes('provider')
    || sourceLower.includes('real')
    || sourceLower.includes('cloud')
    || sourceLower === 'gpt'
    || sourceLower === 'openai'
    || sourceLower === 'azure'
    || sourceLower === 'claude'
    || sourceLower === 'gemini'
    || sourceLower === 'deepseek'
    || sourceLower === 'llama'
    || sourceLower === 'qwen'
    || sourceLower === 'ernie'
  ) {
    return '真实模型';
  }
  return '来源未知';
}

function getAIAuditSourceCategory(sourceText = '') {
  const source = `${sourceText || ''}`.trim().toLowerCase();
  if (!source || source === '—') {
    return 'unknown';
  }
  if (
    source === 'mock'
    || source === 'mock-fallback'
    || source === 'mock-fallback-v2'
    || source.includes('mock')
    || source.includes('模拟')
    || source.includes('simulation')
  ) {
    return 'mock';
  }
  if (
    source === 'provider'
    || source === 'real'
    || source.includes('provider')
    || source.includes('real')
    || source.includes('cloud')
    || source === 'real-model'
    || source.includes('real-model')
    || source === 'gpt'
    || source === 'openai'
    || source === 'azure'
    || source === 'claude'
    || source === 'gemini'
    || source === 'deepseek'
    || source === 'llama'
    || source === 'qwen'
    || source === 'ernie'
    || source.includes('真实')
  ) {
    return 'real';
  }
  return 'unknown';
}

function getAIAuditSourceTone(sourceText = '') {
  const category = getAIAuditSourceCategory(sourceText);
  if (category === 'real') {
    return 'success';
  }
  if (category === 'mock') {
    return 'warn';
  }
  return 'muted';
}

function getAIDecisionCategory(decision = '') {
  const normalized = `${decision || ''}`.trim().toLowerCase();
  if (normalized === 'allowed') {
    return 'allowed';
  }
  if (normalized === 'denied') {
    return 'denied';
  }
  if (normalized === 'mock-fallback') {
    return 'mock';
  }
  return 'other';
}

function getAIDecisionTone(decision = '') {
  const category = getAIDecisionCategory(decision);
  if (category === 'allowed') {
    return 'success';
  }
  if (category === 'denied') {
    return 'danger';
  }
  if (category === 'mock') {
    return 'warn';
  }
  return 'muted';
}

function getAIAuditDecisionLabel(decision = '') {
  const category = getAIDecisionCategory(decision);
  if (category === 'allowed') {
    return '允许';
  }
  if (category === 'denied') {
    return '拒绝';
  }
  if (category === 'mock') {
    return '备用模型';
  }
  return `${decision || '—'}`.trim();
}

function formatDateKey(dateText = '') {
  const parsed = safeToDate(dateText);
  if (!parsed) {
    return '';
  }
  return parsed.toISOString().slice(0, 10);
}

function getRecentDateKeys(days = 7) {
  const size = Number(days) > 1 ? Number(days) : 7;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Array.from({ length: size }, (_, index) => {
    const target = new Date(now);
    target.setDate(now.getDate() - (size - index - 1));
    return target.toISOString().slice(0, 10);
  });
}

const PAGE_CONFIG = [
  { id: 'home', label: '首页', icon: LayoutDashboard, hint: '今日学习任务' },
  { id: 'courses', label: '课程中心', icon: BookOpenCheck, hint: '在读课程与课表' },
  { id: 'practice', label: '学习练习', icon: WandSparkles, hint: '练习与反馈' },
  { id: 'agents', label: '智能体中心', icon: Bot, hint: 'AI 能力执行' },
  { id: 'profile', label: '个人中心', icon: MessageCircleHeart, hint: '成长记录' },
  { id: 'culture-wall', label: '学习成果馆', icon: ImageIcon, hint: '课堂回顾与成果沉淀' }
];

const PLATFORM_PAGE_CONFIG = [
  { id: 'home', label: '机构总览', icon: LayoutDashboard, hint: '机构状态全景' },
  { id: 'courses', label: '机构管理', icon: Building2, hint: '试用与到期策略' },
  { id: 'practice', label: '机构方案', icon: CreditCard, hint: '试用/续用/冻结' },
  { id: 'agents', label: '智能体中心', icon: Bot, hint: 'AI 能力执行' },
  { id: 'profile', label: '资源用量', icon: DatabaseZap, hint: '平台级 AI 资源监控' },
  { id: 'culture-wall', label: '学习成果馆', icon: ImageIcon, hint: '教学内容成果展示' }
];

const AI_AUDIT_ACTION_OPTIONS = [
  { value: '', label: '全部动作' },
  { value: 'feedback_from_lesson', label: 'feedback_from_lesson' },
  { value: 'exercise_generate', label: 'exercise_generate' },
  { value: 'renewal_risk_scan', label: 'renewal_risk_scan' },
  { value: 'invalid-action', label: 'invalid-action' }
];

const AI_AUDIT_DECISION_OPTIONS = [
  { value: '', label: '全部决策' },
  { value: 'allowed', label: 'allowed' },
  { value: 'denied', label: 'denied' },
  { value: 'mock-fallback', label: 'mock-fallback' }
];

const AI_USAGE_DAYS_OPTIONS = [7, 14, 30, 60, 90, 180];

const DAYS_IN_MS = 24 * 60 * 60 * 1000;

function safeToDate(dateText) {
  if (!dateText || typeof dateText !== 'string') {
    return null;
  }
  const parsed = new Date(dateText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysToDate(dateText) {
  const target = safeToDate(dateText);
  if (!target) {
    return Infinity;
  }
  return Math.floor((target.getTime() - Date.now()) / DAYS_IN_MS);
}

const AGE_GROUPS = [
  {
    id: 'age_4_6',
    label: '4-6岁启蒙',
    heroTitle: '一边玩，一边把英语种进耳朵里',
    heroDesc: '从自然拼读、词汇听辨到开口表达，用可爱任务先建立孩子的语言感觉。',
    tag: '启蒙星球'
  },
  {
    id: 'age_7_10',
    label: '7-10岁进阶',
    heroTitle: '把每天的英语学习，整理成可执行的学习路径',
    heroDesc: '课程、练习、成长与反馈统一呈现，孩子和家长都能清楚看到今天要做什么、完成了什么。',
    tag: '进阶探索'
  },
  {
    id: 'age_11_13',
    label: '11-13岁突破',
    heroTitle: '让阅读、语法和表达，进入会积累的正循环',
    heroDesc: '聚焦阅读理解、语法整理和表达输出，把练习整理成可持续的学习路径。',
    tag: '突破任务'
  },
  {
    id: 'age_14_16',
    label: '14-16岁冲刺',
    heroTitle: '把提分目标拆成每天可完成的一小步',
    heroDesc: '围绕词汇、阅读、听说和作业反馈，搭建清晰的学习路径与复盘节奏。',
    tag: '冲刺模式'
  }
];

const OPERATION_LOG_MAX = 14;
const PLATFORM_TRIAL_ORG_LIMITS = {
  students: 50,
  teachers: 3,
  aiLimit: 300,
  aiUsed: 0,
  trialDays: 14
};

function resolveMenuItems(menuConfig, configKey, fallbackIcons) {
  const list = menuConfig?.[configKey] || [];
  return list.map((item) => ({
    ...item,
    icon: iconRegistry[item.icon] || fallbackIcons
  }));
}

function ApiPillRow({ items = [] }) {
  return null;
}

function FounderDashboard({
  cockpit = {},
  leads = [],
  courses = [],
  paymentRecords = [],
  lessonAccounts = [],
  attendanceRecords = [],
  filters = {},
  onFiltersChange,
  onRefresh,
  loading = false,
  message = '',
  onAction,
  onTakeoverLead,
  onConvertLead,
  onAdjustLessonAccount
}) {
  const [leadBusyId, setLeadBusyId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [leadConvertSegments, setLeadConvertSegments] = useState({});
  const [accountStudentId, setAccountStudentId] = useState('');
  const [accountPurchasedHours, setAccountPurchasedHours] = useState('8');
  const [accountAmountCents, setAccountAmountCents] = useState('0');
  const [accountReason, setAccountReason] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const summary = cockpit || {};
  const leadRows = Array.isArray(leads) ? leads : [];
  const selectedLead = leadRows.find((item) => `${item.id || item.leadId || ''}`.trim() === `${selectedLeadId}`.trim()) || leadRows[0] || null;
  const leadStatusCounts = summary.leadsByStatus || {};
  const paymentStatusCounts = summary.paymentRecords?.byStatus || {};
  const attendanceStatusCounts = summary.attendanceByStatus || {};
  const refreshText = loading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshData;
  const countItems = (value = []) => (Array.isArray(value) ? value.length : 0);
  const paymentRows = Array.isArray(paymentRecords) ? paymentRecords : [];
  const lessonRows = Array.isArray(lessonAccounts) ? lessonAccounts : [];
  const recentLessonAdjustment = lessonRows[0] || null;

  const csvEscape = (value) => {
    const text = `${value ?? ''}`;
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const exportPaymentRecords = () => {
    if (paymentRows.length === 0) {
      onAction?.('founder', '缴费记录导出失败：当前没有可导出的记录');
      return;
    }

    const columns = [
      ['record_id', '记录ID'],
      ['order_no', '订单号'],
      ['student_name', '学员'],
      ['student_id', '学员ID'],
      ['student_grade', '年级'],
      ['course_name', '课程'],
      ['course_id', '课程ID'],
      ['status', '收费状态'],
      ['payment_method', '支付方式'],
      ['amount_cents', '金额(分)'],
      ['currency', '币种'],
      ['paid_at', '入账时间'],
      ['created_at', '创建时间'],
      ['notes', '备注']
    ];

    const header = columns.map((item) => item[1]).join(',');
    const csvRows = paymentRows.map((record) =>
      columns.map(([key]) => {
        const value = {
          record_id: record.id || '',
          order_no: record.orderNo || record.order_no || '',
          student_name: record.studentName || record.student_name || '',
          student_id: record.studentId || record.student_id || '',
          student_grade: record.studentGrade || record.student_grade || '',
          course_name: record.courseName || record.course_name || '',
          course_id: record.courseId || record.course_id || '',
          status: record.status || '',
          payment_method: record.paymentMethod || record.payment_method || '',
          amount_cents: record.amountCents || record.amount_cents || 0,
          currency: record.currency || '',
          paid_at: record.paidAt || record.paid_at || '',
          created_at: record.createdAt || record.created_at || '',
          notes: record.notes || ''
        }[key];
        return csvEscape(value);
      }).join(',')
    );

    const fileName = `founder-payment-records-${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob([`\ufeff${[header, ...csvRows].join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.target = '_self';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onAction?.('founder', `导出缴费记录：${paymentRows.length} 条`);
  };

  const updateFilters = (patch = {}) => {
    onFiltersChange?.({
      ...filters,
      ...patch
    });
  };

  const cockpitCards = [
    { icon: TrendingUp, label: '本月收入', value: `¥${summary.totalIncome || summary.revenue || 0}`, note: `对账明细 ${countItems(paymentRecords)} 条` },
    { icon: AlertTriangle, label: '续费预警', value: `${summary.renewalRiskCount || 0}人`, note: '续费/到期需处理', tone: 'yellow' },
    { icon: Users, label: '在读学员', value: `${summary.studentsCount || 0}`, note: '当前活跃学员' },
    { icon: CalendarDays, label: '今日课时处理', value: `${summary.attendanceCount || countItems(attendanceRecords)}节`, note: '今日点名与异常均入账', tone: 'green' },
    { icon: BookOpenCheck, label: '课程', value: `${countItems(courses)}`, note: '课表课程数（可复核）' },
    { icon: WalletCards, label: '课时账', value: `${countItems(lessonAccounts)}`, note: '课时变动记录数' },
    { icon: Sparkles, label: 'AI 用量', value: `${summary.aiUsage?.requests || summary.aiUsage?.total || 0}`, note: '智能体调用与来源' }
  ];

  const requestRefresh = () => {
    onRefresh?.();
    onAction?.('founder', '刷新创始人数据');
  };

  const handleAdjustLessonAccount = async () => {
    if (!onAdjustLessonAccount) {
      return;
    }

    const studentId = `${accountStudentId || ''}`.trim();
    const purchasedHours = Number(accountPurchasedHours || 0);
    const amountCents = Number(accountAmountCents || 0);
    const reason = `${accountReason || ''}`.trim();
    if (!studentId || !reason || !Number.isFinite(purchasedHours) || purchasedHours <= 0) {
      setAccountMessage('请补全学员、课时和原因');
      return;
    }

    setAccountBusy(true);
    setAccountMessage('');
    try {
      const payload = await onAdjustLessonAccount({
        studentId,
        purchasedHours,
        amountCents: Number.isFinite(amountCents) ? amountCents : 0,
        reason
      });
      const note = `${payload?.data?.reason || reason}`.trim();
      setAccountMessage(note ? `已调整：${note}` : '课时已调整');
      setAccountReason('');
      setAccountStudentId('');
      setAccountPurchasedHours('8');
      setAccountAmountCents('0');
      onAction?.('founder', `课时调整：${studentId} / ${note || '已提交'}`);
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      const messageText = error?.message || '课时调整失败';
      setAccountMessage(messageText);
      onAction?.('founder', messageText);
    } finally {
      setAccountBusy(false);
    }
  };

  const handleTakeover = async (leadId) => {
    if (!leadId || !onTakeoverLead) {
      return;
    }
    setLeadBusyId(leadId);
    try {
      await onTakeoverLead(leadId);
      onAction?.('founder', `接管线索：${leadId}`);
    } catch (error) {
      onAction?.('founder', error?.message || '接管失败');
    } finally {
      setLeadBusyId('');
    }
  };

  const handleConvert = async (leadId) => {
    if (!leadId || !onConvertLead) {
      return;
    }
    const currentLead = leadRows.find((item) => `${item.id || item.leadId || ''}`.trim() === `${leadId}`.trim()) || selectedLead;
    const defaultCourseId = `${courses?.[0]?.id || ''}`.trim();
    setLeadBusyId(leadId);
    try {
      const payload = await onConvertLead(leadId, {
        studentName: (currentLead?.guardianName || currentLead?.guardian_name) ? `${currentLead.guardianName || currentLead.guardian_name}的孩子` : '新增学员',
        grade: currentLead?.student_grade || currentLead?.studentGrade || '五年级',
        courseId: defaultCourseId,
        enroll: !!defaultCourseId,
        paymentStatus: 'paid'
      });
      const segments = Array.isArray(payload?.data?.segments)
        ? payload.data.segments
        : Array.isArray(payload?.segments)
          ? payload.segments
          : [];
      setLeadConvertSegments((current) => ({
        ...current,
        [leadId]: segments
      }));
      onAction?.('founder', `线索转学员：${leadId}`);
    } catch (error) {
      onAction?.('founder', error?.message || '转学员失败');
    } finally {
      setLeadBusyId('');
    }
  };

  return (
    <section className="role-grid teacher-workspace">
      <div className="hero-panel">
          <div>
            <h1>经营驾驶舱</h1>
            <p>课程、课时、缴费记录、咨询线索统一在这里管理，关键动作都可回写与审计。</p>
            <div className="hero-actions">
              <button onClick={requestRefresh}>{refreshText}</button>
            </div>
            {message ? <p className="small-note" style={{ marginTop: 10 }}>{message}</p> : null}
            <div className="hero-chip-row">
              <span className="small-note">经营数据已接通</span>
              <span className="small-note">线索可接管</span>
              <span className="small-note">课时可对账</span>
            </div>
          </div>
        <div className="orbit-card">
          <Sparkles />
          <strong>AI 运行概览</strong>
          <span>今日运行状态：{summary.aiUsage?.status || '已接入'}</span>
          <small>支持续费提醒、缺课识别、课时消耗对账</small>
        </div>
      </div>

      <div className="panel wide">
        <PanelTitle icon={Filter} title="创始人筛选" action="控制端查询范围" />
        <div className="hero-chip-row" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <label>
            <span className="small-note">课程状态</span>
            <select value={filters.courseStatus || ''} onChange={(event) => updateFilters({ courseStatus: event.target.value })}>
              <option value="">全部</option>
              <option value="active">进行中</option>
              <option value="paused">已暂停</option>
              <option value="closed">已结课</option>
            </select>
          </label>
          <label>
            <span className="small-note">线索状态</span>
            <select value={filters.leadStatus || ''} onChange={(event) => updateFilters({ leadStatus: event.target.value })}>
              <option value="">全部</option>
              <option value="new">新咨询</option>
              <option value="contacted">已联系</option>
              <option value="trial_scheduled">已预约试听</option>
              <option value="trial_completed">已完成试听</option>
              <option value="enrolled">已转正式</option>
              <option value="invalid">无效</option>
            </select>
          </label>
          <label>
            <span className="small-note">收费状态</span>
            <select value={filters.paymentStatus || ''} onChange={(event) => updateFilters({ paymentStatus: event.target.value })}>
              <option value="">全部</option>
              <option value="paid">已收</option>
              <option value="pending">待收</option>
              <option value="refunded">已退</option>
            </select>
          </label>
          <label>
            <span className="small-note">开始日期</span>
            <input type="date" value={filters.startAt || ''} onChange={(event) => updateFilters({ startAt: event.target.value })} />
          </label>
          <label>
            <span className="small-note">结束日期</span>
            <input type="date" value={filters.endAt || ''} onChange={(event) => updateFilters({ endAt: event.target.value })} />
          </label>
          <button className="row-action" onClick={requestRefresh} disabled={loading}>
            {refreshText}
          </button>
        </div>
      </div>

      <div className="metrics">
        {cockpitCards.map((item) => <MetricCard key={item.label} {...item} />)}
      </div>

      <div className="panel wide">
        <PanelTitle icon={ClipboardList} title="今日经营概览" />
          <div className="alert-list">
            <div className="alert-row">
              <span className="status-dot green" />
              <div>
                <strong>对账口径</strong>
              <small>课时、缴费记录和到课数据已统一接通</small>
              </div>
              <small className="small-note">课时账项：{summary.lessonAccountSummary?.totalRecords || 0}</small>
            </div>
            <div className="alert-row">
              <span className="status-dot blue" />
              <div>
                <strong>点名与异常</strong>
              <small>点名和异常记录可直接查看</small>
              </div>
              <small className="small-note">异常 {summary.exceptionCount || 0}</small>
            </div>
          <div className="alert-row">
            <span className="status-dot green" />
            <div>
              <strong>线索接管</strong>
              <small>可接管、可转化、可追踪状态变化</small>
            </div>
            <small className="small-note">线索 {summary.leadsTotal || leadRows.length || 0}</small>
          </div>
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={Rocket} title="咨询线索" action={`新咨询 ${leadStatusCounts.new || 0}`} />
        {leadRows.length === 0 ? <div className="small-note">{UI_COPY.empty.noLeads}</div> : null}
        {leadRows.map((lead) => {
          const leadId = `${lead.id || lead.leadId}`;
          const isSelected = `${selectedLeadId || ''}`.trim() === leadId || (!selectedLeadId && leadRows[0]?.id === lead.id);
          return (
            <React.Fragment key={leadId}>
              <div className={`pipeline-row ${isSelected ? 'active' : ''}`} onClick={() => setSelectedLeadId(leadId)}>
                <span>{lead.status || 'new'}</span>
                <strong>{lead.guardianName || '未填写家长名'}</strong>
                <small>{lead.student_grade || lead.studentGrade || '五年级'}</small>
                <span className="pipeline-row-actions">
                  <button
                    className="row-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleTakeover(leadId);
                    }}
                    disabled={leadBusyId === leadId}
                  >
                    {leadBusyId === leadId ? '处理中...' : '接管'}
                  </button>
                  <button
                    className="row-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleConvert(leadId);
                    }}
                    disabled={leadBusyId === leadId}
                  >
                    {leadBusyId === leadId ? '处理中...' : '转正式'}
                  </button>
                </span>
              </div>
              {Array.isArray(leadConvertSegments[leadId]) && leadConvertSegments[leadId].length > 0 ? (
                <div className="alert-list" style={{ margin: '6px 0 12px' }}>
                  {leadConvertSegments[leadId].map((segment) => (
                    <div className="alert-row" key={`${leadId}-${segment.stage}`}>
                      <span className={`status-dot ${segment.status === 'failed' ? 'red' : segment.status === 'skipped' ? 'yellow' : 'green'}`} />
                      <div>
                        <strong>{segment.label || segment.stage}</strong>
                        <small>{segment.status || 'unknown'} · {segment.message || '无补充说明'}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
        {selectedLead ? (
          <div className="panel" style={{ marginTop: 12 }}>
            <PanelTitle icon={ClipboardList} title="线索详情" action={selectedLead.status || 'new'} />
            <div className="alert-list">
              <div className="alert-row">
                <span className="status-dot green" />
                <div>
                  <strong>{selectedLead.guardianName || '未填写家长名'}</strong>
                  <small>{selectedLead.student_grade || selectedLead.studentGrade || '年级待录入'} · {selectedLead.need_summary || selectedLead.needSummary || UI_COPY.empty.noLearningNeed}</small>
                </div>
                <small className="small-note">{selectedLead.updatedAt || selectedLead.updated_at || selectedLead.createdAt || '刚刚'}</small>
              </div>
              <div className="alert-row">
                <span className="status-dot blue" />
                <div>
                  <strong>AI 建议</strong>
                  <small>{selectedLead.aiRecommendation || selectedLead.ai_recommendation || '等待 AI 生成或补充人工建议'}</small>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <PanelTitle icon={BookOpenCheck} title="课程与缴费" action={`课程 ${countItems(courses)} / 缴费 ${countItems(paymentRows)}`} />
        {countItems(courses) === 0 ? <div className="small-note">{UI_COPY.empty.noCourseData}</div> : null}
        {(courses || []).slice(0, 6).map((course) => (
          <div className="alert-row" key={course.id || `${course.name}-${course.startAt || ''}`}>
            <span className="status-dot green" />
            <div>
              <strong>{getCourseDisplay(course).name}</strong>
              <small>
                {course.grade || '年级待录入'} · {normalizeCourseClassType(course)} · {course.status || '课程状态待更新'}
              </small>
              <small className="small-note">
                {normalizeCourseRules(course).scheduleDate} · {normalizeCourseRules(course).attendanceRule}
              </small>
            </div>
            <small className="small-note">
              {normalizeCourseFee(course)} · {normalizeCourseTime(course)}
            </small>
          </div>
        ))}
        <div style={{ height: 10 }} />
        <div className="section-headline" style={{ marginTop: 12 }}>
          <div>
            <span>缴费记录</span>
            <h3>缴费记录筛选与导出</h3>
          </div>
          <button className="row-action" onClick={exportPaymentRecords} disabled={paymentRows.length === 0}>
            导出 CSV
          </button>
        </div>
        <div className="payment-filter-grid">
          <label>
            <span className="small-note">学员ID</span>
            <input
              value={filters.paymentStudentId || ''}
              onChange={(event) => updateFilters({ paymentStudentId: event.target.value })}
              placeholder="按学员筛选"
            />
          </label>
          <label>
            <span className="small-note">课程ID</span>
            <input
              value={filters.paymentCourseId || ''}
              onChange={(event) => updateFilters({ paymentCourseId: event.target.value })}
              placeholder="按课程筛选"
            />
          </label>
          <label>
            <span className="small-note">开始日期</span>
            <input
              type="date"
              value={filters.paymentStartAt || ''}
              onChange={(event) => updateFilters({ paymentStartAt: event.target.value })}
            />
          </label>
          <label>
            <span className="small-note">结束日期</span>
            <input
              type="date"
              value={filters.paymentEndAt || ''}
              onChange={(event) => updateFilters({ paymentEndAt: event.target.value })}
            />
          </label>
        </div>
        <div className="hero-chip-row" style={{ marginTop: 8 }}>
          <span className="small-note">已收：{paymentStatusCounts.paid || 0}</span>
          <span className="small-note">待收：{paymentStatusCounts.pending || 0}</span>
          <span className="small-note">已退：{paymentStatusCounts.refunded || 0}</span>
          <span className="small-note">筛选后：{paymentRows.length} 条</span>
        </div>
        {countItems(paymentRows) === 0 ? <div className="small-note">{UI_COPY.empty.noPaymentRecords}</div> : null}
        {(paymentRows || []).slice(0, 6).map((record) => (
          <div className="alert-row" key={record.id || record.order_no || `${record.studentId || ''}-${record.paid_at || ''}`}>
            <span className="status-dot blue" />
            <div>
              <strong>{record.studentName || record.student_name || '匿名学员'}</strong>
              <small>
                {record.status || '已入账'} · {record.courseName || record.course_name || '课程待核对'} · {record.order_no || record.orderNo || '订单号待核对'}
              </small>
            </div>
            <small className="small-note">
              {formatCents(record.amount_cents || record.amountCents || 0)} · {record.paidAt || record.paid_at || record.createdAt || ''}
            </small>
          </div>
        ))}
      </div>

      <div className="panel">
        <PanelTitle icon={WalletCards} title="课时对账" action={`账户 ${countItems(lessonRows)}`} />
        <div className="audit-filters" style={{ marginBottom: 12 }}>
          <input
            value={accountStudentId}
            onChange={(event) => setAccountStudentId(event.target.value)}
            placeholder="学员ID"
          />
          <input
            type="number"
            min="1"
            value={accountPurchasedHours}
            onChange={(event) => setAccountPurchasedHours(event.target.value)}
            placeholder="调整课时"
          />
          <input
            type="number"
            min="0"
            value={accountAmountCents}
            onChange={(event) => setAccountAmountCents(event.target.value)}
            placeholder="金额(分)"
          />
          <input
            value={accountReason}
            onChange={(event) => setAccountReason(event.target.value)}
            placeholder="调整原因"
          />
          <button className="row-action" onClick={handleAdjustLessonAccount} disabled={accountBusy || !accountReason.trim()}>
            {accountBusy ? '提交中...' : '提交调整'}
          </button>
        </div>
        {accountMessage ? <div className="small-note" style={{ marginBottom: 12 }}>{accountMessage}</div> : null}
        {recentLessonAdjustment ? (
          <div className="alert-row" style={{ marginBottom: 12 }}>
            <span className="status-dot yellow" />
            <div>
              <strong>最近调整</strong>
              <small>
                {recentLessonAdjustment.studentName || recentLessonAdjustment.student_name || recentLessonAdjustment.studentId || '未知学员'}
                {' '}· 购课 {recentLessonAdjustment.purchased_hours || recentLessonAdjustment.purchasedHours || 0}
                {' '}· 剩余 {recentLessonAdjustment.remaining_hours || recentLessonAdjustment.remainingHours || 0}
              </small>
            </div>
            <small className="small-note">
              {recentLessonAdjustment.notes || recentLessonAdjustment.reason || '无原因'}
            </small>
          </div>
        ) : null}
        {countItems(lessonRows) === 0 ? <div className="small-note">{UI_COPY.empty.noLessonAccounts}</div> : null}
        {lessonRows.slice(0, 6).map((account) => (
          <div className="alert-row" key={account.id || `${account.studentId || ''}-${account.courseId || ''}`}>
            <span className="status-dot green" />
            <div>
              <strong>{account.studentName || account.student_name || '未知学员'}</strong>
              <small>
                购课 {account.purchased_hours || account.purchasedHours || 0} · 已用 {account.used_hours || account.usedHours || 0} · 保留 {account.hold_hours || account.holdHours || 0}
              </small>
            </div>
            <div className="small-note" style={{ textAlign: 'right' }}>
              <div>剩余 {account.remaining_hours || account.remainingHours || 0}</div>
              <div>{account.notes || account.reason || '无调整原因'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <PanelTitle icon={CalendarDays} title="到课记录" action={`记录 ${countItems(attendanceRecords)}`} />
        {countItems(attendanceRecords) === 0 ? <div className="small-note">{UI_COPY.empty.noAttendanceRecords}</div> : null}
        {(attendanceRecords || []).slice(0, 6).map((record) => (
          <div className="alert-row" key={record.id || `${record.studentId || ''}-${record.attended_at || ''}`}>
            <span className="status-dot blue" />
            <div>
              <strong>{record.studentName || record.student_name || '未知学员'}</strong>
              <small>{record.courseName || record.course_name || record.courseId || '未关联课程'} · {record.teacherName || record.teacher_name || record.teacherId || '未关联老师'}</small>
            </div>
            <small className="small-note">{record.status || '已签到'}</small>
          </div>
        ))}
        <div className="hero-chip-row" style={{ marginTop: 10 }}>
          <span className="small-note">到课：{attendanceStatusCounts.attended || 0}</span>
          <span className="small-note">请假：{attendanceStatusCounts.leave || 0}</span>
          <span className="small-note">缺课：{attendanceStatusCounts.absent || 0}</span>
          <span className="small-note">迟到：{attendanceStatusCounts.late || 0}</span>
        </div>
      </div>

    </section>
  );
}

function TeacherWorkspace({
  lessons = [],
  students = [],
  exceptions = [],
  onRunAgent,
  onSubmitAttendance,
  onPersistLessonFeedback,
  onAssignExercise,
  onSubmitIntervention,
  onRefresh,
  loading = false,
  message = '',
  onAction
}) {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id);
  const [showAuthorizedOnly, setShowAuthorizedOnly] = useState(true);
  const [showCurrentExceptionOnly, setShowCurrentExceptionOnly] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('attended');
  const [attendanceNote, setAttendanceNote] = useState('');
  const [attendanceTarget, setAttendanceTarget] = useState('selected');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [teacherMessage, setTeacherMessage] = useState('');
  const [bulkClosing, setBulkClosing] = useState(false);
  const [bulkCloseReport, setBulkCloseReport] = useState([]);
  const [agentBusy, setAgentBusy] = useState({
    feedback: false,
    exercise: false
  });
  const [agentMessage, setAgentMessage] = useState('');
  const [lessonStates, setLessonStates] = useState(() => ({
    ...(lessons.reduce((acc, lesson) => {
      acc[lesson.id] = {
        closed: false,
        feedbackDone: false,
        exerciseDone: false,
        status: lesson.status || '待确认',
        feedbackText: '',
        exerciseOutput: null,
        feedbackSuggestions: []
      };
      return acc;
    }, {}))
  }));
  const [interventionType, setInterventionType] = useState('follow');
  const [interventionNote, setInterventionNote] = useState('');

  const currentLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0] || {};
  const visibleLessons = (lessons || []).filter((item) => (showAuthorizedOnly ? (item.authorized !== false) : true));
  const visibleStudents = Array.isArray(students) ? students : [];
  const currentStudent = visibleStudents.find((item) => `${item.id || item.studentId || ''}`.trim() === `${selectedStudentId}`.trim()) || visibleStudents[0] || {};
  const exceptionList = showCurrentExceptionOnly
    ? exceptions.filter((item) => `${item.courseId || ''}`.trim() === `${currentLesson.id || ''}`.trim())
    : exceptions;

  useEffect(() => {
    if (!showAuthorizedOnly) {
      return;
    }
    if (!currentLesson?.id && visibleLessons[0]?.id) {
      setSelectedLessonId(visibleLessons[0].id);
      return;
    }
    if (currentLesson?.id && !visibleLessons.some((item) => item.id === currentLesson.id)) {
      setSelectedLessonId(visibleLessons[0]?.id);
    }
  }, [showAuthorizedOnly, visibleLessons, currentLesson?.id, lessons]);

  useEffect(() => {
    if (currentLesson?.studentId || currentLesson?.student_id) {
      setSelectedStudentId(`${currentLesson.studentId || currentLesson.student_id || ''}`.trim());
    }
  }, [currentLesson?.studentId, currentLesson?.student_id, currentLesson?.id]);

  const toggleAuthScope = () => {
    setShowAuthorizedOnly((value) => !value);
    onAction?.(
      'teacher',
      showAuthorizedOnly ? '教师端：查看全部学员' : '教师端：仅看授权学员'
    );
  };

  const requestRefresh = () => {
    onRefresh?.();
    onAction?.('teacher', UI_COPY.actions.refreshTeacherBoard);
  };

  useEffect(() => {
    if (!visibleStudents.length) {
      return;
    }
    const currentExists = visibleStudents.some((item) => `${item.id || item.studentId || ''}`.trim() === `${selectedStudentId}`.trim());
    if (!currentExists) {
      setSelectedStudentId(visibleStudents[0]?.id || visibleStudents[0]?.studentId || '');
    }
  }, [visibleStudents, selectedStudentId]);

  const activeState = lessonStates[selectedLessonId] || {
    closed: false,
    feedbackDone: false,
    exerciseDone: false,
    status: '待确认',
    feedbackText: '',
    exerciseOutput: null,
    feedbackSuggestions: []
  };

  const setActiveState = (patch) =>
    setLessonStates((prev) => ({
      ...prev,
      [selectedLessonId]: {
        ...prev[selectedLessonId],
        ...patch
      }
    }));

  const quickClose = async () => {
    if (!currentLesson?.id) {
      return;
    }
    try {
      const targetStudentId = currentStudent?.id || currentStudent?.studentId || currentLesson.studentId || currentLesson.student_id || '';
      const result = await onSubmitAttendance?.(currentLesson.id, {
        studentId: targetStudentId,
        status: attendanceStatus || 'attended',
        sourceLessonId: currentLesson.id,
        note: attendanceNote || '教师课时记录',
        teacherId: currentLesson.teacherId || ''
      });
      const deductions = result?.data?.summary?.lessons || [];
      const deduction = deductions.find((item) => `${item.studentId || ''}`.trim() === `${targetStudentId}`.trim()) || deductions[0] || null;
      const deductionText = Number(deduction?.hoursDeducted || 0) > 0
        ? `，扣减 ${deduction.hoursDeducted} 节，扣前 ${Number(deduction.beforeRemaining || 0)} 节，剩余 ${Number(deduction.afterRemaining || 0)} 节${deduction?.accountId ? `，账户 ${deduction.accountId}` : ''}`
        : '';
      setActiveState({
        closed: true,
        feedbackDone: true,
        exerciseDone: true,
        status: '已完成'
      });
      setTeacherMessage(`已提交点名：${attendanceStatus} / ${currentStudent?.name || currentStudent?.studentName || currentLesson?.student || '当前学生'}${deductionText}`);
      onAction?.('teacher', `课程记录完成：${currentLesson?.student || '当前课程'}`);
    } catch (error) {
      setActiveState({
        closed: false,
        feedbackDone: false,
        exerciseDone: false,
        status: '处理失败'
      });
      setTeacherMessage(error?.message || '点名失败');
      onAction?.('teacher', error?.message || '点名失败');
    }
  };

  const quickCloseAll = async () => {
    if (!visibleLessons.length) {
      onAction?.('teacher', '教师端：当前无相关处理课程');
      return;
    }
    setBulkClosing(true);
    setBulkCloseReport([]);
    try {
      const results = await Promise.all(
        visibleLessons.map(async (lesson) => {
          if (!onSubmitAttendance) {
            throw new Error('缺少点名接口');
          }

          try {
            const result = await onSubmitAttendance(lesson.id, {
              studentId: lesson.studentId || lesson.student_id || '',
              status: attendanceStatus || 'attended',
              sourceLessonId: lesson.id,
              note: attendanceNote || '教师课时记录（批量）',
              teacherId: lesson.teacherId || ''
            });
            const summary = result?.data?.summary || {};
            const shortages = Array.isArray(summary.shortages) ? summary.shortages : [];
            const deductions = Array.isArray(summary.lessons) ? summary.lessons : [];
            return {
              status: shortages.length > 0 ? 'partial' : 'ok',
              lessonId: lesson.id,
              lessonTitle: lesson.student || lesson.studentName || lesson.course || lesson.topic || lesson.id,
              shortages,
              deduction: deductions.find((item) => `${item.studentId || ''}`.trim() === `${lesson.studentId || lesson.student_id || ''}`.trim()) || deductions[0] || null
            };
          } catch (error) {
            return {
              status: 'failed',
              lessonId: lesson.id,
              lessonTitle: lesson.student || lesson.studentName || lesson.course || lesson.topic || lesson.id,
              error: error instanceof Error ? error.message : '批量记录失败'
            };
          }
        })
      );

      const succeededIds = results.filter((item) => item.status === 'ok' || item.status === 'partial').map((item) => item.lessonId);
      const failedItems = results.filter((item) => item.status !== 'ok');
      const failedCount = failedItems.length;
      setBulkCloseReport(failedItems);

      setLessonStates((prev) => {
        const nextStates = { ...prev };
        succeededIds.forEach((lessonId) => {
          nextStates[lessonId] = {
            ...(nextStates[lessonId] || {}),
            closed: true,
            feedbackDone: true,
            exerciseDone: true,
            status: '已完成',
            feedbackText: nextStates[lessonId]?.feedbackText || '',
            exerciseOutput: nextStates[lessonId]?.exerciseOutput || null,
            feedbackSuggestions: nextStates[lessonId]?.feedbackSuggestions || []
          };
        });
        return nextStates;
      });

      if (failedCount > 0) {
        const failedNames = failedItems.slice(0, 3).map((item) => item.lessonTitle).filter(Boolean).join('、');
        const failedReasons = failedItems.slice(0, 3).map((item) => {
          if (item.status === 'partial') {
            const shortageText = (item.shortages || []).map((shortage) => shortage.reason || '课时不足').join('；');
            return `${item.lessonTitle}：${shortageText || '部分失败'}`;
          }
          return `${item.lessonTitle}：${item.error || '处理失败'}`;
        });
        onAction?.('teacher', `批量记录完成：${succeededIds.length}/${visibleLessons.length} 节，${failedCount}条失败`);
        setTeacherMessage(`批量记录部分失败：${failedCount} 条未写入${failedNames ? `（${failedNames}）` : ''}`);
        if (failedReasons.length > 0) {
          setBulkCloseReport(failedItems);
        }
      } else {
        onAction?.('teacher', `批量记录 ${visibleLessons.length} 节课程`);
        setTeacherMessage(`批量记录完成：${visibleLessons.length} 节`);
      }
    } catch (error) {
      setTeacherMessage(error?.message || '批量记录失败');
      onAction?.('teacher', error?.message || '批量记录失败');
    } finally {
      setBulkClosing(false);
    }
  };

  const runAgentFeedback = async () => {
    if (!currentLesson.student) {
      onAction?.('teacher', 'AI反馈生成失败：请先选择课程并重试');
      return;
    }
    if (activeState.feedbackDone) {
      setActiveState({
        feedbackDone: false,
        status: '待确认',
        feedbackText: '',
        feedbackSuggestions: []
      });
      onAction?.('teacher', `撤销反馈：${currentLesson?.student || '当前课程'}`);
      return;
    }
    setAgentBusy((prev) => ({ ...prev, feedback: true }));
    setAgentMessage('星语官正在生成反馈...');

    try {
      const payload = await onRunAgent?.({
        action: 'feedback_from_lesson',
        payload: {
          studentName: currentLesson.student,
          student: currentLesson.student,
          grade: currentLesson.grade,
          topic: currentLesson.topic,
          energy: currentLesson.energy,
          risk: currentLesson.risk
        }
      });

      const output = payload?.output || {};
      const feedbackText = output.content || output.title || '反馈已形成';
      if (!currentLesson.id) {
        throw new Error('缺少课程ID，无法同步家长反馈');
      }
      await onPersistLessonFeedback?.({
        lessonId: currentLesson.id,
        institutionId: currentLesson.institutionId || currentLesson.institution_id || '',
        parentFeedback: feedbackText
      });
      setActiveState({
        feedbackDone: true,
        status: '反馈已同步',
        feedbackText,
        feedbackSuggestions: Array.isArray(output.suggestions) ? output.suggestions : []
      });
      onAction?.('teacher', `AI反馈已同步家长端：${currentLesson?.student || '当前课程'}`);
      setAgentMessage(`AI反馈已同步：${getAIAgentSourceLabel(payload)}`);
    } catch (error) {
      onAction?.('teacher', `AI反馈失败：${currentLesson?.student || '当前课程'}`);
      setAgentMessage(`AI反馈失败：${error?.message || '服务异常'}`);
      setActiveState({
        feedbackDone: false,
        status: '待确认',
        feedbackText: '',
        feedbackSuggestions: []
      });
    } finally {
      setAgentBusy((prev) => ({ ...prev, feedback: false }));
    }
  };

  const runAgentExercise = async () => {
    if (activeState.exerciseDone) {
      setActiveState({
        exerciseDone: false,
        status: activeState.feedbackDone ? '反馈已形成' : '待确认',
        exerciseOutput: null
      });
      onAction?.('teacher', `撤销练习：${currentLesson?.student || '当前课程'}`);
      return;
    }
    if (!currentLesson.student) {
      onAction?.('teacher', 'AI练习生成失败：请先选择课程并重试');
      return;
    }
    setAgentBusy((prev) => ({ ...prev, exercise: true }));
    setAgentMessage('星练官正在生成练习题...');

    try {
      const payload = await onRunAgent?.({
        action: 'exercise_generate',
        payload: {
          studentName: currentLesson.student,
          student: currentLesson.student,
          grade: currentLesson.grade,
          topic: currentLesson.topic,
          difficulty: currentLesson.level || '中'
        }
      });

      const output = payload?.output || {};
      const exercise = {
        title: output.title || '练习题已同步',
        tasks: Array.isArray(output.tasks) && output.tasks.length ? output.tasks : []
      };
      const targetStudentId = currentStudent?.id || currentStudent?.studentId || currentLesson.studentId || currentLesson.student_id || '';
      if (!targetStudentId) {
        throw new Error('缺少学生ID，无法同步练习题');
      }
      await onAssignExercise?.({
        studentId: targetStudentId,
        lessonId: currentLesson.id || '',
        title: exercise.title,
        tasks: exercise.tasks,
        topic: currentLesson.topic || '',
        difficulty: currentLesson.level || 'medium'
      });
      setActiveState({
        exerciseDone: true,
        status: '练习已同步',
        exerciseOutput: exercise
      });
      onAction?.('teacher', `AI练习已同步：${currentLesson?.student || '当前课程'}`);
      setAgentMessage(`练习题已同步：${getAIAgentSourceLabel(payload)}`);
    } catch (error) {
      onAction?.('teacher', `AI练习失败：${currentLesson?.student || '当前课程'}`);
      setAgentMessage(`练习生成失败：${error?.message || '服务异常'}`);
      setActiveState({
        exerciseDone: false,
        status: activeState.feedbackDone ? '反馈已形成' : '待确认',
        exerciseOutput: null
      });
    } finally {
      setAgentBusy((prev) => ({ ...prev, exercise: false }));
    }
  };

  const renderExerciseOutput = () => {
    if (!activeState.exerciseOutput) {
      return null;
    }
    return (
      <ul className="small-note" style={{ marginTop: 8, paddingLeft: 14 }}>
        {(activeState.exerciseOutput.tasks || []).map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ul>
    );
  };

  const closedCount = visibleLessons.filter((lesson) => lessonStates[lesson.id]?.closed).length;
  const closedTotal = visibleLessons.length;

  const submitIntervention = async () => {
    const targetStudentId = currentStudent?.id || currentStudent?.studentId || currentLesson?.studentId || currentLesson?.student_id || '';
    if (!targetStudentId || !interventionNote.trim()) {
      return;
    }
    try {
      await onSubmitIntervention?.(targetStudentId, {
        interventionType,
        action: `教师动作：${interventionType}`,
        note: interventionNote,
        priority: 'high',
        channel: 'teacher'
      });
      setInterventionNote('');
      setTeacherMessage('干预已提交');
      onAction?.('teacher', `提交干预：${currentLesson.student || '当前学生'}`);
    } catch (error) {
      setTeacherMessage(error?.message || '干预提交失败');
      onAction?.('teacher', error?.message || '干预提交失败');
    }
  };

  return (
    <section className="role-grid parent-workspace">
      <div className="panel wide">
        <PanelTitle
          icon={CalendarDays}
          title="教师今日任务"
          action={
            <button className="row-action" onClick={toggleAuthScope}>
              {showAuthorizedOnly ? '查看全部学员' : '仅看授权学员'}
            </button>
          }
        />
        <div className="hero-chip-row" style={{ marginTop: 10, alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <label>
            <span>点名对象</span>
            <select value={attendanceTarget} onChange={(event) => setAttendanceTarget(event.target.value)}>
              <option value="selected">当前课程学生</option>
              <option value="manual">手动切换学生</option>
            </select>
          </label>
          <label>
            <span>到课状态</span>
            <select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value)}>
              <option value="attended">到课</option>
              <option value="leave">请假</option>
              <option value="absent">缺课</option>
              <option value="late">迟到</option>
            </select>
          </label>
          <label>
            <span>选择学生</span>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              disabled={attendanceTarget !== 'manual'}
            >
              <option value="">自动匹配当前课程</option>
              {visibleStudents.map((student) => (
                <option key={student.id || student.studentId} value={student.id || student.studentId || ''}>
                  {student.name || student.studentName || '未知学生'} · {student.grade || '未知年级'}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1, minWidth: 240 }}>
            <span>点名备注</span>
            <input
              value={attendanceNote}
              onChange={(event) => setAttendanceNote(event.target.value)}
              placeholder="如：家长临时请假 / 迟到 10 分钟"
            />
          </label>
          <button className="row-action" onClick={requestRefresh} disabled={loading}>
            {loading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshTeacherBoard}
          </button>
        </div>
        {message ? <div className="small-note" style={{ marginTop: 8 }}>{message}</div> : null}
        {teacherMessage ? <div className="small-note" style={{ marginTop: 8 }}>{teacherMessage}</div> : null}
        <div className="hero-chip-row">
          <span className="small-note">仅看授权学员</span>
          <span className="small-note">课堂记录可回填</span>
          <span className="small-note">家长信息自动脱敏</span>
        </div>
        <div className="lesson-board">
              {visibleLessons.length === 0 ? (
                <div className="small-note">当前条件下暂无匹配课程</div>
              ) : (
                visibleLessons.map((lesson) => (
                <button
                  className={`lesson-card ${selectedLessonId === lesson.id ? 'active' : ''}`}
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setSelectedStudentId(`${lesson.studentId || lesson.student_id || ''}`.trim());
                    onAction?.('teacher', `选择课程：${lesson.student}`);
                  }}
                >
                  <span>{normalizeCourseTime(lesson, '未安排课程')}</span>
                  <strong>{lesson.student}</strong>
                  <small>{lesson.grade} · {lesson.course} · {normalizeCourseClassType(lesson)}</small>
                  <small style={{ marginTop: 5 }}>
                    {normalizeCourseFee(lesson)}
                  </small>
                  <small className="small-note" style={{ marginTop: 3 }}>
                    {normalizeCourseRules(lesson).scheduleDate} · {normalizeCourseRules(lesson).holdRule}
                  </small>
                  <small className="small-note" style={{ marginTop: 3 }}>
                    {lessonStates[lesson.id]?.status || '待确认'}
                  </small>
                </button>
              )))}
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={EyeOff} title="学员信息保护" />
        <div className="privacy-box">
          <ShieldCheck />
          <strong>仅在系统内沟通，默认脱敏展示</strong>
          <p>家长手机号：138****6721<br />微信号：已脱敏<br />完整资料仅创始人可见</p>
          <div className="small-note">低情绪语言模板已默认开启，减少沟通失误</div>
        </div>
      </div>

      <div className="panel wide">
        <PanelTitle
          icon={WandSparkles}
          title="课堂记录与反馈"
          action={
          <button className="row-action" onClick={quickCloseAll}>
            {bulkClosing ? '处理中...' : '批量完成全部'}
          </button>
        }
        />
        <div className="quick-form">
          <button className={activeState.closed ? 'ghost' : ''} onClick={quickClose} disabled={visibleLessons.length === 0 || bulkClosing}>
            {activeState.closed ? '已扣课时：完成' : bulkClosing ? '处理中...' : '完成记录'}
          </button>
            <button className={activeState.feedbackDone ? 'ghost' : ''} onClick={runAgentFeedback} disabled={agentBusy.feedback || visibleLessons.length === 0}>
              {activeState.feedbackDone ? '反馈内容已形成' : '生成反馈内容'}
            </button>
            <button className={activeState.exerciseDone ? 'ghost' : ''} onClick={runAgentExercise} disabled={agentBusy.exercise || visibleLessons.length === 0}>
              {activeState.exerciseDone ? '练习题已同步' : 'AI生成练习题'}
            </button>
        </div>
        {bulkCloseReport.length > 0 ? (
          <div className="small-note" style={{ marginTop: 8 }}>
            <strong>批量处理明细：</strong>
            {bulkCloseReport.map((item) => {
              if (item.status === 'partial') {
                const shortageText = (item.shortages || []).map((shortage) => shortage.reason || '课时不足').filter(Boolean).join('；');
                return `${item.lessonTitle}${shortageText ? `（${shortageText}）` : ''}`;
              }
              return `${item.lessonTitle}${item.error ? `（${item.error}）` : ''}`;
            }).join('、')}
          </div>
        ) : null}
        <div className="ai-output">
          {activeState.feedbackText || '当前无未完成课程，可继续处理授权学生。'}
            {activeState.feedbackSuggestions.length > 0 ? (
            <ul className="small-note" style={{ marginTop: 8, paddingLeft: 14 }}>
              {activeState.feedbackSuggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {renderExerciseOutput()}
        </div>
        <div className="small-note" style={{ marginTop: 8 }}>
          <label>
            <span>老师干预类型</span>
            <select value={interventionType} onChange={(event) => setInterventionType(event.target.value)}>
              <option value="follow">跟进</option>
              <option value="homework">作业</option>
              <option value="attendance">到课异常</option>
            </select>
          </label>
          <label>
            <span>干预内容</span>
            <textarea
              value={interventionNote}
              onChange={(event) => setInterventionNote(event.target.value)}
              placeholder="填写处理动作"
            />
          </label>
          <button onClick={submitIntervention} className="row-action" disabled={!interventionNote.trim()}>
            提交干预
          </button>
        </div>
        {agentMessage ? <div className="small-note" style={{ marginTop: 8 }}>{agentMessage}</div> : null}
        <div className="small-note" style={{ marginTop: 10 }}>
          {activeState.closed ? '已完成' : '未完成'} · 反馈：{activeState.feedbackDone ? '已完成' : '待完成'} · 练习：{activeState.exerciseDone ? '已完成' : '待完成'} · 今日已完成：{closedCount}/{closedTotal}课
        </div>
      </div>

      <div className="panel">
        <PanelTitle
          icon={Rocket}
          title="异常跟进"
          action={
            <button className="row-action" onClick={() => setShowCurrentExceptionOnly((value) => !value)}>
              {showCurrentExceptionOnly ? '查看全部异常' : '仅看当前课程'}
            </button>
          }
        />
        {exceptionList.length === 0 ? <div className="small-note">{UI_COPY.empty.noExceptions}</div> : null}
        {exceptionList.map((item) => {
          const key = `${item.id || item.studentId || item.courseId}-${item.type || 'exception'}`;
          return (
            <div
              className="pipeline-row"
              key={key}
              onClick={() => setSelectedStudentId(item.studentId || item.student_id || '')}
            >
              <span>{item.type || '异常'}</span>
              <strong>{item.studentName || item.student || '未绑定学员身份'}</strong>
              <small>{item.reason || item.note || '请补充原因'}</small>
            </div>
          );
        })}
        <div className="small-note" style={{ marginTop: 8 }}>
          当前选中：{currentStudent?.name || currentStudent?.studentName || '未选择学生'}
        </div>
      </div>
    </section>
  );
}

function ParentView({
  children = [],
  childSummary = {},
  childCourses = [],
  childLessonAccount = {},
  childPaymentRecords = [],
  selectedChildId = '',
  onChildSelect,
  onExportReport,
  onRefresh,
  loading = false,
  message = '',
  onAction
}) {
  const summary = childSummary || {};
  const normalizedChildren = Array.isArray(children) ? children : [];
  const selectedChild = normalizedChildren.find((item) => `${item.id || item.studentId}` === `${selectedChildId}`) || normalizedChildren[0] || {};
  const firstChild = summary.student || summary.child || selectedChild || {};
  const child = {
    name: firstChild.name || firstChild.studentName || '本校学员',
    grade: firstChild.grade || '五年级',
    progress: Number(summary.summary?.doneRate || summary.progress || 0),
    hoursLeft: Number(childLessonAccount.summary?.remaining || summary.lessonAccount?.remaining || firstChild.hoursLeft || 0)
  };
  const report = {
    weekLearned: `已完成 ${summary.summary?.doneTasks || 0}/${summary.summary?.totalTasks || 0} 项`,
    strength: summary.summary?.strength || (summary.strength || '暂无'),
    weakness: summary.summary?.weakness || (summary.weakness || '暂无'),
    nextStep: summary.summary?.nextStep || (summary.nextStep || '建议先完成今日学习打卡，再查看反馈'),
    summary: summary.summary?.text
      || summary.summaryText
      || `本周完成 ${summary.summary?.doneTasks || 0}/${summary.summary?.totalTasks || 0} 项，平均分 ${summary.summary?.averageScore || 0}。`
  };
  const [reportStatus, setReportStatus] = useState(UI_COPY.status.pending);
  const [isExporting, setIsExporting] = useState(false);
  const paidCount = (childPaymentRecords || []).filter((item) => `${item.status || ''}`.trim() === 'paid').length;
  const totalPaidCents = (childPaymentRecords || []).reduce((sum, item) => sum + Number(item.amount_cents || item.amountCents || item.amount || item.paidAmount || 0), 0);
  const totalPaid = formatCents(totalPaidCents);
  const todayTasks = Array.isArray(summary.todayTasks) ? summary.todayTasks : [];
  const recentRecords = Array.isArray(summary.recent) ? summary.recent : [];
  const lessonFeedback = Array.isArray(summary.lessonFeedback)
    ? summary.lessonFeedback
    : Array.isArray(summary.recentFeedback)
      ? summary.recentFeedback
      : [];
  const currentChildId = `${selectedChildId || firstChild?.studentId || firstChild?.id || ''}`.trim();

  const refreshParent = () => {
    onRefresh?.();
    onAction?.('parent', UI_COPY.actions.refreshParentBoard);
  };

  const exportReport = async () => {
    if (!currentChildId) {
      setReportStatus('导出失败：未选择孩子');
      onAction?.('parent', '导出阶段报告失败：未选择孩子');
      return;
    }
    if (!onExportReport) {
      setReportStatus('导出失败：导出服务暂不可用，请稍后重试');
      onAction?.('parent', '导出阶段报告失败：导出服务暂不可用，请稍后重试');
      return;
    }

    setIsExporting(true);
    setReportStatus(UI_COPY.loading.refreshing);

    try {
      await Promise.resolve(onRefresh?.());
      await Promise.resolve(onExportReport(currentChildId));
      setReportStatus(`已导出 · ${new Date().toLocaleString('zh-CN', { hour12: false })}`);
      onAction?.('parent', '导出阶段报告');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      setReportStatus(`导出失败：${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="role-grid">
      <div className="hero-panel parent-panel">
        <div>
          <h1>{child.name} 的成长记录</h1>
          <p>
            只看家长最需要的信息：进步、短板、下一步安排。
          </p>
          {normalizedChildren.length > 0 ? (
            <label style={{ marginTop: 8 }}>
              <span>选择孩子</span>
              <select
                value={selectedChildId || firstChild?.studentId || firstChild?.id || ''}
                onChange={(event) => onChildSelect?.(event.target.value)}
              >
                <option value="">-- 请选择 --</option>
                {normalizedChildren.map((item) => (
                  <option key={item.id || item.studentId || item.student?.id} value={item.studentId || item.id || item.student?.id || ''}>
                    {item.name || item.studentName || item.student?.name} · {item.grade || item.gradeAlias || '五年级'}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="hero-chip-row" style={{ marginTop: 10 }}>
            <button className="row-action" onClick={refreshParent} disabled={loading}>
              {loading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshParentBoard}
            </button>
            <span className="small-note">孩子数：{normalizedChildren.length}</span>
          </div>
          {message ? <div className="small-note" style={{ marginTop: 8 }}>{message}</div> : null}
        </div>
        <div className="growth-ring">
          <strong>{child.progress}%</strong>
          <span>阶段完成度</span>
        </div>
      </div>

      <div className="metrics">
        <MetricCard icon={BookOpenCheck} label="本周学习" value={`${summary.summary?.doneTasks || 0}项`} note={report.weekLearned} />
        <MetricCard icon={WalletCards} label="剩余课时" value={`${child.hoursLeft}节`} note="到课后可自动保留" tone="yellow" />
        <MetricCard icon={TrendingUp} label="课表课程" value={`${childCourses.length}门`} note={summary.courses?.length ? `当前共 ${summary.courses.length} 门` : '暂无课程数据'} tone="green" />
        <MetricCard icon={MessageCircleHeart} label="课堂反馈" value={lessonFeedback.length > 0 ? '已更新' : '未更新'} note={lessonFeedback[0]?.createdAt || '待课程跟进更新'} />
      </div>

      <div className="panel wide">
        <PanelTitle icon={Sparkles} title="进步与加固建议" />
        <div className="check-list">
          <div className="small-note">哪里进步：{report.strength}</div>
          <div className="small-note">哪里要加强：{report.weakness}</div>
          <div className="small-note">阶段建议：{report.nextStep}</div>
          <div className="small-note">最近动态：{recentRecords[0]?.title || recentRecords[0]?.taskTitle || '系统将在任务提交后生成'}</div>
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={CalendarDays} title="课程安排" action={`共 ${childCourses.length} 门`} />
        {childCourses.length === 0 ? <div className="small-note">{UI_COPY.empty.noClasses}</div> : null}
        {(childCourses || []).slice(0, 6).map((course) => (
          <div className="alert-row" key={course.id || course.courseId || `${course.name || ''}-${course.start_time || ''}`}>
            <span className="status-dot green" />
            <div>
              <strong>{getCourseDisplay(course).name}</strong>
              <small>
                {course.grade || '年级待录入'} · {normalizeCourseClassType(course)} · {normalizeCourseFee(course)}
              </small>
            </div>
            <small className="small-note">
              {normalizeCourseTime(course)}
            </small>
          </div>
        ))}
      </div>

      <div className="panel">
        <PanelTitle icon={WalletCards} title="课时与保留" action={formatCents(childLessonAccount.summary?.amountCents || childLessonAccount.amountCents || 0)} />
        <div className="alert-list">
          <div className="alert-row">
            <span className="status-dot blue" />
            <div>
              <strong>入账课时</strong>
              <small>{childLessonAccount.summary?.purchased || childLessonAccount.purchasedHours || 0} 节</small>
            </div>
            <small className="small-note">剩余 {child.hoursLeft} 节</small>
          </div>
          <div className="alert-row">
            <span className="status-dot green" />
            <div>
              <strong>已使用</strong>
              <small>{childLessonAccount.summary?.consumed || childLessonAccount.usedHours || 0} 节</small>
            </div>
            <small className="small-note">保留 {childLessonAccount.summary?.hold || childLessonAccount.holdHours || 0} 节</small>
          </div>
        </div>
        <div className="small-note" style={{ marginTop: 8 }}>
          {Array.isArray(childLessonAccount.records) && childLessonAccount.records.length ? `最近记录 ${childLessonAccount.records.length} 条` : UI_COPY.empty.noLessons}
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={CreditCard} title="缴费记录摘要" action={`已记录 ${paidCount} 笔`} />
        {childPaymentRecords.length === 0 ? <div className="small-note">{UI_COPY.empty.noPayments}</div> : null}
        {(childPaymentRecords || []).slice(0, 6).map((record) => (
          <div className="alert-row" key={record.id || record.order_no || `${record.studentId || ''}-${record.paid_at || ''}`}>
            <span className="status-dot blue" />
            <div>
              <strong>{record.order_no || record.orderNo || '订单号待核对'}</strong>
              <small>{record.status || '已入账'} · {record.paid_at || record.paidAt || '入账时间待更新'}</small>
            </div>
            <small className="small-note">
              {formatCents(record.amount_cents || record.amountCents || record.amount || 0)}
            </small>
          </div>
        ))}
        <div className="small-note" style={{ marginTop: 8 }}>
          合计金额：{totalPaid}
        </div>
        <div className="hero-chip-row" style={{ marginTop: 10 }}>
          <button
            className="row-action"
            onClick={() => onAction?.('parent', '家长查看缴费记录有疑问，可联系老师/机构')}
          >
            <MessageCircleHeart size={16} />
            <span>有疑问，联系老师/机构</span>
          </button>
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={MessageCircleHeart} title="最近课堂反馈" action={`${lessonFeedback.length} 条`} />
        {lessonFeedback.length === 0 ? <div className="small-note">老师生成并同步后，将在这里展示课堂反馈。</div> : null}
        {(lessonFeedback || []).slice(0, 5).map((item) => (
          <div className="pipeline-row" key={item.id || item.lessonId || `${item.topic || ''}-${item.createdAt || ''}`}>
            <span>{item.createdAt || '刚更新'}</span>
            <strong>{item.topic || '课堂反馈'}</strong>
            <small>{item.parentFeedback || item.feedback || '暂无反馈内容'}</small>
          </div>
        ))}
      </div>

      <div className="panel">
        <PanelTitle icon={MessageCircleHeart} title="今日任务" action={`${todayTasks.length} 项`} />
        {todayTasks.length === 0 ? <div className="small-note">今日暂无任务安排</div> : null}
        {(todayTasks || []).slice(0, 6).map((task) => (
          <div className="pipeline-row" key={task.id || task.taskId || `${task.title || ''}-${task.createdAt || ''}`}>
            <span>{task.status || 'todo'}</span>
            <strong>{task.title || task.taskTitle || '学习任务'}</strong>
            <small>{task.note || task.content || '请按计划完成'}</small>
          </div>
        ))}
      </div>

      <div className="panel">
        <PanelTitle
          icon={MessageCircleHeart}
          title="阶段报告"
          action={
            <button className="row-action" onClick={exportReport} disabled={isExporting}>
              {isExporting ? UI_COPY.loading.exporting : UI_COPY.actions.exportPdf}
            </button>
          }
        />
        <p className="large-text">{report.summary}</p>
        <div className="small-note">{reportStatus}</div>
        <div className="small-note">
          缴费记录：已记录 {paidCount} 笔，金额 {formatCents(totalPaidCents)}
        </div>
      </div>
    </section>
  );
}

function StudentView({
  todayPath = [],
  reviewSummary = {},
  reviewHistory = [],
  reviewMistakes = [],
  courses = [],
  lessonAccount = {},
  voicePractice = {},
  loading = false,
  message = '',
  onRefresh,
  onRefreshCourses,
  onRefreshPractice,
  onSubmitVoiceAssess,
  publicCourses = [],
  publicCoursesLoading = false,
  publicLeadSubmitting = false,
  onSubmitPublicLead,
  onSubmitTrialBooking,
  onRefreshPublicCourses,
  onNavigatePage,
  onSubmitPathCompletion,
  onAction,
  admissionsMedia = []
}) {
  const normalizeTasks = (source) => {
    const sourceTasks = Array.isArray(source) ? source : [];
    if (sourceTasks.length > 0) {
      return sourceTasks.map((task, index) => {
        const taskKey = `${task.id || task.taskId || `task_${index}`}`;
        const feedback = taskFeedback[taskKey];
        return {
          id: taskKey,
          title: task.title || task.courseName || '课程任务',
          status: task.status || (task.done ? 'done' : 'pending'),
          done: !!feedback || task.status === 'done' || !!task.done || task.status === 'submitted',
          note: task.note || task.topic || '请完成学习任务',
          transcript: task.transcript || feedback?.transcript || '',
          score: Number(feedback?.score || task.score || 0)
        };
      });
    }
    return COURSE_PATH_STEPS.map((step, index) => ({
      id: `${step.id || `path_${index}`}`,
      title: step.title || `任务 ${index + 1}`,
      status: step.status || 'open',
      done: step.status === 'done',
      note: step.desc || '按顺序完成今日学习任务',
      transcript: step.desc || step.title || '',
      score: 0
    }));
  };

  const [taskFeedback, setTaskFeedback] = useState({});
  const [tasks, setTasks] = useState(() => normalizeTasks(todayPath));
  const [taskDrafts, setTaskDrafts] = useState({});
  const [selectedPublicCourseId, setSelectedPublicCourseId] = useState('');
  const [trialGuardianName, setTrialGuardianName] = useState('');
  const [trialLeadId, setTrialLeadId] = useState('');
  const [trialStatusText, setTrialStatusText] = useState('未提交咨询');
  const [trialBusy, setTrialBusy] = useState(false);
  useEffect(() => {
    setTasks(normalizeTasks(todayPath));
    setTaskDrafts((prev) => {
      const next = {};
      normalizeTasks(todayPath).forEach((task) => {
        next[task.id] = prev[task.id] ?? task.transcript ?? task.note ?? task.title;
      });
      return next;
    });
  }, [todayPath]);
  const [assessingTaskId, setAssessingTaskId] = useState('');
  const doneCount = tasks.filter((task) => task.done).length;
  const nextStep = reviewSummary?.nextStep || reviewSummary?.summary?.nextStep || voicePractice?.result || '完成今日任务并提交语音评分后继续';
  const remainingHours = Number(lessonAccount?.summary?.remaining || lessonAccount?.remainingHours || 0);
  const lessonsCount = Array.isArray(courses) ? courses.length : 0;
  const summaryStats = reviewSummary?.summary || reviewSummary || {};
  const studentName = summaryStats.studentName || summaryStats.name || '当前学员';
  const studentGrade = summaryStats.grade || summaryStats.studentGrade || '五年级';
  const studentProgress = Number(summaryStats.doneRate || summaryStats.progress || 0);
  const studentMetrics = {
    vocabCount: summaryStats.vocabCount || summaryStats.words || 1280,
    studyHours: summaryStats.studyHours || summaryStats.learnHours || 36.5,
    checkinDays: summaryStats.checkinDays || summaryStats.streakDays || Math.max(1, Math.round(studentProgress / 2) || 45),
    medals: summaryStats.medals || summaryStats.badges || 28
  };
  const report = {
    summary: summaryStats.summaryText || summaryStats.summary || summaryStats.text || `已完成 ${summaryStats.done || 0}/${summaryStats.total || 0} 项，平均分 ${summaryStats.averageScore || 0}。`,
    strength: summaryStats.strength || '本阶段保持稳定投入',
    weakness: summaryStats.weakness || '建议加强复读和口语模仿',
    nextStep: summaryStats.nextStep || summaryStats.suggestion || voicePractice?.result || '完成今日任务并提交语音评分后继续'
  };
  const historyItems = Array.isArray(reviewHistory) ? reviewHistory : [];
  const mistakeItems = Array.isArray(reviewMistakes) ? reviewMistakes : [];
  const publicCourseList = Array.isArray(publicCourses) ? publicCourses : [];
  const admissionsPosterList = Array.isArray(admissionsMedia) ? admissionsMedia.slice(0, 4) : [];
  const [pathActionText, setPathActionText] = useState('');
  const selectedPublicCourse = publicCourseList.find((course) => `${course.id}`.trim() === `${selectedPublicCourseId}`);
  const selectedPublicCourseDisplay = selectedPublicCourse ? getCourseDisplay(selectedPublicCourse) : null;
  const selectedPublicCourseRules = selectedPublicCourse ? normalizeCourseRules(selectedPublicCourse) : null;
  const taskToneIcons = [BookOpenCheck, Headphones, Mic, Trophy];
  const homePracticeCards = [
    { id: 'words', title: '单词星球', desc: '看图记词 + 发音模仿', note: '适合每天 8 分钟', icon: Headphones },
    { id: 'reading', title: '阅读任务', desc: '故事阅读 + 线索查找', note: '读完即可获得积分', icon: BookOpenCheck },
    { id: 'speaking', title: '口语小剧场', desc: '跟读表达 + 情景表达', note: '每次练 3 句就够', icon: Mic },
    { id: 'grammar', title: '语法拼图', desc: '把句子变成会搭积木的规则', note: '一题一反馈', icon: WandSparkles },
    { id: 'listening', title: '听力训练', desc: '听关键词，找正确答案', note: '3 分钟一轮', icon: Headphones },
    { id: 'test', title: '综合测试', desc: '把学过的内容连起来用', note: '周末冲刺使用', icon: Trophy }
  ];
  const homeCourseCards = (courses || []).slice(0, 4).map((course, index) => {
    const display = getCourseDisplay(course);
    const rawProgress = course?.progress || course?.doneRate || course?.progressPercent || reviewSummary?.summary?.doneRate || 72 - index * 11;
    const parsedProgress = Number(`${rawProgress}`.replace(/[^\d.]/g, ''));
    const progress = Math.min(
      100,
      Math.max(
        20,
        Number.isFinite(parsedProgress) ? parsedProgress : Number(rawProgress) || 72 - index * 11
      )
    );
    return {
      id: course.id || course.courseId || course.course_id || `course-${index}`,
      title: display.name || course.name || course.courseName || course.title || `课程 ${index + 1}`,
      grade: course.grade || '年级待录入',
      classType: normalizeCourseClassType(course),
      fee: normalizeCourseFee(course),
      time: normalizeCourseTime(course),
      progress
    };
  });
  const completedPathIds = useMemo(() => {
    const collected = [];
    const pathItems = [...historyItems, ...tasks].filter((item) => {
      const taskType = `${item?.taskType || item?.task_type || ''}`.trim();
      const source = `${item?.payload?.source || item?.source || ''}`.trim();
      return taskType === 'path_completion' || source === 'student_home_path';
    });

    pathItems.forEach((item) => {
      const payload = item?.payload || {};
      const pathId = `${payload.pathId || item.pathId || item.id || ''}`.trim();
      const pathTitle = `${payload.pathTitle || item.title || ''}`.trim();
      const matchedStep = COURSE_PATH_STEPS.find((step) => step.id === pathId || step.title === pathTitle);
      const resolvedId = matchedStep?.id || pathId || '';
      if (resolvedId && !collected.includes(resolvedId)) {
        collected.push(resolvedId);
      }
    });

    if (collected.length === 0) {
      collected.push(COURSE_PATH_STEPS[0]?.id || 'story');
    }

    return collected;
  }, [historyItems, tasks]);
  const lastCompletedIndex = Math.max(
    ...completedPathIds.map((id) => COURSE_PATH_STEPS.findIndex((item) => item.id === id)),
    COURSE_PATH_STEPS.findIndex((item) => item.id === COURSE_PATH_STEPS[0]?.id)
  );
  const getStudentPathStatus = (step, index) => {
    if (completedPathIds.includes(step.id)) {
      return 'done';
    }
    if (index <= lastCompletedIndex + 1) {
      return 'active';
    }
    return 'locked';
  };

  useEffect(() => {
    if (!selectedPublicCourseId && publicCourseList[0]?.id) {
      setSelectedPublicCourseId(`${publicCourseList[0].id}`);
    }
  }, [publicCourseList, selectedPublicCourseId]);

  const updateDraft = (taskId, value) => {
    setTaskDrafts((prev) => ({
      ...prev,
      [taskId]: value
    }));
  };

  const submitTaskAssess = async (task) => {
    if (!onSubmitVoiceAssess) {
      return;
    }

    setAssessingTaskId(task.id);
    try {
      const transcript = `${taskDrafts[task.id] || task.transcript || task.note || task.title || ''}`.trim();
      const response = await onSubmitVoiceAssess({
        taskId: task.id,
        transcript
      });
      const result = response?.data?.result || response?.data?.record?.result || '评分已完成';
      const score = Number(response?.data?.score ?? 0);
      const suggestions = Array.isArray(response?.data?.record?.suggestions)
        ? response.data.record.suggestions
        : Array.isArray(response?.data?.suggestions)
          ? response.data.suggestions
          : [];
      setTaskFeedback((prev) => ({
        ...prev,
        [task.id]: {
          score: Number(response?.data?.score ?? 0),
          result,
          suggestions,
          recordId: response?.data?.record?.id || ''
        }
      }));
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? { ...item, done: true, status: 'done', score: score || 0, transcript }
            : item
        )
      );
      if (onRefresh) {
        await onRefresh();
      }
      onAction?.('student', `任务提交：${task.title}`);
    } catch (error) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, done: false, score: 0 } : item
        )
      );
      onAction?.('student', `任务提交失败：${task.title}${error?.message ? `（${error.message}）` : ''}`);
    } finally {
      setAssessingTaskId('');
    }
  };

  const handleOpenCourses = async () => {
    if (onRefreshCourses) {
      try {
        await onRefreshCourses();
      } catch {
        // 刷新失败不中断跳转
      }
    }
    onNavigatePage?.('courses');
    onAction?.('student', '查看在读课程');
  };

  const handleOpenPractice = async () => {
    if (onRefreshPractice) {
      try {
        await onRefreshPractice();
      } catch {
        // 刷新失败不中断跳转
      }
    }
    onNavigatePage?.('practice');
    onAction?.('student', '进入学习练习');
  };

  const handleOpenPath = async (step) => {
    if (!step) {
      return;
    }
    const stepIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === step.id);
    const payload = {
      pathId: step.id,
      title: step.title,
      pathTitle: step.title,
      stepIndex,
      source: 'student_home_path'
    };
    if (onSubmitPathCompletion) {
      setPathActionText('正在记录路径完成状态...');
      try {
        await onSubmitPathCompletion({
          ...payload,
          answer: `已完成「${step.title}」`
        });
        setPathActionText(`已记录「${step.title}」`);
        onAction?.('student', `完成路径：${step.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '路径提交失败';
        setPathActionText(`路径提交失败：${message}`);
        onAction?.('student', `路径提交失败：${step.title}${message ? `（${message}）` : ''}`);
        return;
      }
    }
    if (onRefreshPractice) {
      try {
        await onRefreshPractice();
      } catch {
        // 刷新失败不中断跳转
      }
    }
    const pathPracticeMap = {
      warmup: 'vocab',
      story: 'vocab',
      grammar: 'grammar',
      show: 'speaking'
    };
    onNavigatePage?.('practice', { practiceModuleId: pathPracticeMap[step.id] || 'vocab' });
    onAction?.('student', `打开路径：${step.title}`);
  };

  const handleSubmitTrialLead = async () => {
    if (!onSubmitPublicLead || !selectedPublicCourse) {
      setTrialStatusText('请先选择试听课程');
      return;
    }
    const guardianName = `${trialGuardianName || ''}`.trim();
    if (!guardianName) {
      setTrialStatusText('请填写家长姓名');
      return;
    }
    setTrialBusy(true);
    setTrialStatusText('咨询提交中...');
    try {
      const payload = await onSubmitPublicLead({
        institutionId: `${selectedPublicCourse.institutionId || ''}`.trim(),
        guardianName,
        studentGrade,
        needSummary: `${selectedPublicCourseDisplay?.name || selectedPublicCourse.name || '试听课程'} 咨询`,
        initialMessage: '我想预约试听',
        courseId: selectedPublicCourseId
      });
      const leadId = `${payload?.data?.lead?.id || payload?.lead?.id || ''}`.trim();
      setTrialLeadId(leadId);
      setTrialStatusText(leadId ? `咨询已提交：${leadId}` : '咨询已提交');
      onAction?.('home', '学生首页提交公开咨询');
    } catch (error) {
      setTrialStatusText(error?.message || '咨询提交失败');
      onAction?.('home', '学生首页公开咨询失败');
    } finally {
      setTrialBusy(false);
    }
  };

  const handleSubmitTrialBooking = async () => {
    if (!onSubmitTrialBooking || !selectedPublicCourse) {
      setTrialStatusText('请先选择试听课程');
      return;
    }
    if (!trialLeadId) {
      setTrialStatusText('请先提交咨询，再预约试听');
      return;
    }
    setTrialBusy(true);
    setTrialStatusText('试听预约提交中...');
    try {
      await onSubmitTrialBooking({
        leadId: trialLeadId,
        institutionId: `${selectedPublicCourse.institutionId || ''}`.trim(),
        courseId: selectedPublicCourseId,
        reservedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 60,
        sourceChannel: 'student_home'
      });
      setTrialStatusText('试听预约已提交');
      onAction?.('home', '学生首页提交试听预约');
    } catch (error) {
      setTrialStatusText(error?.message || '试听预约提交失败');
      onAction?.('home', '学生首页试听预约失败');
    } finally {
      setTrialBusy(false);
    }
  };

  const handleOpenCourseCard = async (course) => {
    if (!course) {
      return;
    }
    if (onRefreshCourses) {
      try {
        await onRefreshCourses();
      } catch {
        // 刷新失败不中断跳转
      }
    }
    onNavigatePage?.('courses', { selectedCourseId: course.id });
    onAction?.('student', `打开课程：${course.title}`);
  };

  const handleOpenPracticeCard = async (practice) => {
    if (!practice) {
      return;
    }
    if (onRefreshPractice) {
      try {
        await onRefreshPractice();
      } catch {
        // 刷新失败不中断跳转
      }
    }
    const practiceArenaMap = {
      words: 'vocab',
      reading: 'vocab',
      speaking: 'speaking',
      grammar: 'grammar',
      listening: 'vocab',
      test: 'grammar'
    };
    onNavigatePage?.('practice', { practiceModuleId: practiceArenaMap[practice.id] || practice.id });
    onAction?.('student', `进入练习：${practice.title}`);
  };

  return (
    <section className="role-grid">
      <div className="hero-panel learning-product-hero student-home-hero">
        <div className="hero-main-board">
          <div className="hero-storyboard">
            <div className="hero-story-copy">
              <div className="home-brand-line">
                <span className="brand-logo-mark" aria-hidden="true">★</span>
                <div className="brand-line-copy">
                  <span>Aggie速记英语</span>
                  <small>面向 4-16 岁儿童的英语学习系统</small>
                </div>
              </div>
              <h1>Hi, {studentName || '同学'}！</h1>
              <p>今天的学习路径已经就绪，按顺序完成即可。</p>
              <button className="row-action" onClick={onRefresh} disabled={loading || !onRefresh}>
                {loading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshTaskBoard}
              </button>
              <p className="small-note hero-action-note">今天的任务已经准备好，按顺序完成即可。课程库：{lessonsCount} 门，剩余课时 {remainingHours} 节。</p>
              <div className="hero-chip-row">
                <span className="small-note">当前学员：{studentName}</span>
                <span className="small-note">年级：{studentGrade}</span>
                <span className="small-note">剩余课时：{remainingHours}节</span>
              </div>
              <div className="hero-score-board">
                <div className="hero-score-head">
                  <strong>Lv.{Math.max(1, Math.round(studentProgress / 10) || 1)} 英语学习等级</strong>
                  <small>{Math.min(1200, Math.round(studentProgress * 12))} / 1200 经验值</small>
                </div>
                <div className="learning-progress-bar hero-score-progress">
                  <span style={{ width: `${Math.min(100, Math.max(studentProgress, 12))}%` }} />
                </div>
                <div className="hero-stat-board">
                  <div className="hero-stat-card">
                    <span>词汇量</span>
                    <strong>{studentMetrics.vocabCount}</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>学习时长</span>
                    <strong>{studentMetrics.studyHours}小时</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>累计打卡</span>
                    <strong>{studentMetrics.checkinDays}天</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>勋章总数</span>
                    <strong>{studentMetrics.medals}枚</strong>
                  </div>
                </div>
              </div>
              <div className="home-quick-launch">
                <button className="home-quick-card" onClick={() => void handleOpenCourses()}>
                  <strong>在读课程</strong>
                  <small>查看在读课程</small>
                </button>
              <button className="home-quick-card" onClick={() => void handleOpenPractice()}>
                  <strong>学习练习</strong>
                  <small>查看学习练习</small>
                </button>
              </div>
            </div>
            <div className="hero-mascot-board">
              <div className="hero-mascot-caption">今日学习路线</div>
              <div className="hero-focus-card">
                <span>今日重点</span>
                <strong>{studentGrade}</strong>
                <small>{report.nextStep}</small>
              </div>
              <div className="hero-signpost-stack">
                <span>听得懂</span>
                <span>记得住</span>
                <span>说得出</span>
                <span>用得好</span>
              </div>
              <AggieMascotArt />
              <div className="mascot-badge">学习进度可视化</div>
            </div>
          </div>
        </div>
            <div className="hero-side-stack">
          <div className="hero-mentor-card">
            <div className="hero-mentor-head">
              <div>
                <strong>AI 学习教练</strong>
                <small>口语评分 · 纠音建议</small>
              </div>
              <span className="hero-online-dot">在线服务</span>
            </div>
            <div className="hero-mentor-bubble">
              <p>{studentName || '同学'}，先完成“今日重点”后进入本节语音练习。</p>
              <p>评分结果会回写至学习复盘与家校摘要，支持课后追踪。</p>
            </div>
            <div className="hero-mentor-art-wrap">
              <AggieMascotArt className="compact" />
            </div>
            <button className="hero-mentor-primary" onClick={onRefresh}>开启口语评估</button>
            <div className="hero-mentor-actions">
              <span>语音评分</span>
              <span>发音纠正</span>
              <span>情景口语</span>
              <span>学习复盘</span>
            </div>
          </div>
            <div className="hero-feedback-card">
              <div className="hero-mentor-head">
                <div>
                  <strong>阶段复盘</strong>
                  <small>本周进度核对</small>
                </div>
                <span className="hero-online-dot">已同步</span>
              </div>
            <div className="hero-mentor-bubble">
              <p>本周建议优先强化：语音输出连贯度与理解迁移。</p>
              <p>{report.summary}</p>
            </div>
              <div className="hero-feedback-metrics">
                <span>学习态度 <strong>良好</strong></span>
                <span>课堂表现 <strong>{report.strength || '稳定'}</strong></span>
              <span>进步指数 <strong>{Math.max(1, Math.round(studentProgress || 92))}%</strong></span>
              </div>
          </div>
            <div className="hero-culture-card">
                <div className="hero-mentor-head">
                  <div>
                    <strong>学习成果馆</strong>
                  <small>课程素材 · 家校可见</small>
                </div>
                  <span className="hero-online-dot">查看详情</span>
                </div>
            <div className="culture-preview-grid">
              <div className="culture-preview-tile">课堂视频</div>
              <div className="culture-preview-tile">学习作品</div>
              <div className="culture-preview-tile">课后反馈</div>
              <div className="culture-preview-tile">家长联络</div>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="student-home-message">
          {message}
        </div>
      ) : null}

      <div className="panel wide student-path-panel">
        <PanelTitle
          icon={Rocket}
          title="今日学习路径"
          action="先热身，再阅读，再拼句，最后练习表达"
        />
        <div className="student-path-grid">
          {COURSE_PATH_STEPS.map((step, index) => {
            const status = getStudentPathStatus(step, index);
            const statusLabel = status === 'done'
              ? '已完成'
              : status === 'active'
                ? '进行中'
                : status === 'locked'
                  ? '待解锁'
                  : '未开始';
            return (
              <article className={`student-path-card ${status}`} key={step.id}>
                <div className="student-path-head">
                  <span className="student-path-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="home-path-status">{statusLabel}</span>
                </div>
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
              <div className="student-path-footer">
                  <small>{step.reward}</small>
                  <button className="row-action ghost" onClick={() => void handleOpenPath(step)}>开始任务</button>
                </div>
              </article>
            );
          })}
        </div>
        {pathActionText ? <div className="small-note" style={{ marginTop: 8 }}>{pathActionText}</div> : null}
      </div>

      <div className="panel wide student-task-panel">
        <PanelTitle
          icon={Sparkles}
          title={`每日任务（${doneCount}/${tasks.length}已完成）`}
          action={
            <button className="row-action" onClick={onRefresh} disabled={loading || !onRefresh}>
              {loading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshTaskBoard}
            </button>
          }
        />
        <div className="student-task-grid">
          {tasks.map((task, index) => (
            <article className={`student-task-card ${task.done ? 'done' : ''}`} key={task.id}>
              <div className="student-task-head">
                <span className="student-task-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="student-task-status">{task.done ? '已完成' : '开始学习'}</span>
              </div>
              <div className="student-task-title-row">
                {React.createElement(taskToneIcons[index % taskToneIcons.length], { size: 22 })}
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.done ? '已完成' : '未完成'} · {task.note}</small>
                </div>
              </div>
              <div className="learning-progress-bar student-task-progress">
                <span style={{ width: `${taskFeedback[task.id]?.score ? Math.max(40, Math.min(100, taskFeedback[task.id].score)) : task.done ? 100 : 45}%` }} />
              </div>
              {taskFeedback[task.id] ? (
                <div className="student-task-feedback">
                  <strong>{taskFeedback[task.id].score} 分</strong>
                  <small>{taskFeedback[task.id].result}</small>
                  {taskFeedback[task.id].suggestions?.length ? (
                    <span>{taskFeedback[task.id].suggestions.join(' / ')}</span>
                  ) : null}
                </div>
              ) : null}
              <label className="inline-input-group student-task-input">
                <span>口语稿</span>
                <textarea
                  value={taskDrafts[task.id] || ''}
                  onChange={(event) => updateDraft(task.id, event.target.value)}
                  rows={2}
                  placeholder="输入或粘贴识别稿，提交后自动评分"
                />
              </label>
              <button
                className="row-action student-task-action"
                onClick={() => submitTaskAssess(task)}
                disabled={assessingTaskId === task.id || loading}
              >
                {assessingTaskId === task.id
                  ? '提交中...'
                  : task.done ? '重新评分' : '开始学习'}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="student-dual-grid">
        <div className="panel student-course-panel">
          <PanelTitle
            icon={CalendarDays}
            title={`在读课程（${homeCourseCards.length}门）`}
            action={<button className="row-action" onClick={() => void handleOpenCourses()}>
              查看课程明细
            </button>}
          />
          <div className="student-course-grid">
            {homeCourseCards.map((course, index) => (
              <button
                className="student-course-card"
                key={course.id}
                onClick={() => void handleOpenCourseCard(course)}
              >
                <span className="student-course-index">{String(index + 1).padStart(2, '0')}</span>
                <strong>{course.title}</strong>
                <small>{course.grade} · {course.classType}</small>
                <small>{course.fee}</small>
                <div className="learning-progress-bar student-course-progress">
                  <span style={{ width: `${course.progress}%` }} />
                </div>
                <div className="student-course-meta">
                  <span>{course.progress}%</span>
                  <small>{course.time}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel student-practice-panel">
          <PanelTitle
            icon={WandSparkles}
            title="学习练习"
            action={<button className="row-action" onClick={() => void handleOpenPractice()}>
              进入更多练习
            </button>}
          />
          <div className="student-practice-grid">
            {homePracticeCards.map((practice) => (
              <button
                className="student-practice-card"
                key={practice.id}
                onClick={() => void handleOpenPracticeCard(practice)}
              >
                <div className="student-practice-icon">
                  <practice.icon size={22} />
                </div>
                <strong>{practice.title}</strong>
                <small>{practice.desc}</small>
                <span>{practice.note}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="student-dual-grid">
        <div className="panel">
          <PanelTitle icon={MessageCircleHeart} title="学习建议与复盘" />
          <div className="student-review-note">{nextStep}</div>
          <div className="student-review-summary">{voicePractice?.result || '提交语音后，这里会显示纠音建议。'}</div>
        </div>
        <div className="panel">
          <PanelTitle icon={FileText} title="最近复盘记录" action={`${historyItems.length} 条`} />
          {historyItems.length === 0 ? <div className="small-note">暂无复盘记录</div> : null}
          <div className="stack-list">
            {historyItems.slice(0, 4).map((item, index) => (
              <div className="data-card" key={`${item.id || item.taskId || `history-${index}`}`}>
                <strong>{item.title || item.taskName || item.task_type || `记录 ${index + 1}`}</strong>
                <small>{item.status || item.state || 'completed'} · {item.score ?? 0} 分</small>
                <div className="small-note">{item.answer || item.result || item.note || item.transcript || '已完成提交'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="student-dual-grid">
        <div className="panel">
          <PanelTitle icon={AlertTriangle} title="错题与弱项" action={`${mistakeItems.length} 项`} />
          {mistakeItems.length === 0 ? <div className="small-note">暂无薄弱项记录</div> : null}
          <div className="stack-list">
            {mistakeItems.slice(0, 4).map((item, index) => (
              <div className="data-card" key={`${item.id || item.taskId || `mistake-${index}`}`}>
                <strong>{item.title || item.taskName || `弱项 ${index + 1}`}</strong>
                <small>{item.score ?? 0} 分 · {item.status || '待复习'}</small>
                <div className="small-note">{item.answer || item.note || item.topic || '建议重新听读一遍并重复提交。'}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelTitle icon={CalendarDays} title="今日课程清单" action={`${lessonsCount} 门`} />
          {courses.length === 0 ? <div className="small-note">暂无课程记录</div> : null}
          {(courses || []).slice(0, 4).map((course, index) => (
            <div className="alert-row" key={course.id || course.courseId || `${course.name || ''}-${index}`}>
              <span className="status-dot blue" />
              <div>
                <strong>{getCourseDisplay(course).name}</strong>
                <small>
                  {course.grade || '年级待录入'} · {normalizeCourseClassType(course)} · {normalizeCourseFee(course)}
                </small>
              </div>
              <small className="small-note">{normalizeCourseTime(course)}</small>
            </div>
          ))}
        </div>
      </div>

      <section className="panel home-section">
        <div className="section-headline">
          <div>
            <span>招生入口</span>
            <h3>公开课程与试听</h3>
          </div>
          <button className="row-action" onClick={onRefreshPublicCourses} disabled={!onRefreshPublicCourses || publicCoursesLoading}>
            {publicCoursesLoading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshPublicCourses}
          </button>
        </div>
        <section className="panel admissions-panel">
          <div className="section-headline compact">
            <div>
              <span>招生海报</span>
              <h3>可随时更新的前台素材</h3>
            </div>
            <button className="row-action ghost" onClick={() => onNavigatePage?.('culture-wall')}>
              查看成果馆
            </button>
          </div>
          {admissionsPosterList.length > 0 ? (
            <div className="media-grid photo-grid admissions-poster-grid">
              {admissionsPosterList.map((item) => (
                <article className="media-item admissions-poster-card" key={item.id}>
                  <div className="media-cover photo-cover admissions-poster-cover">
                    <img src={item.src || item.mediaUrl || item.coverUrl || ''} alt={item.title || '招生海报'} />
                  </div>
                  <div className="media-body">
                    <strong>{item.title || '招生海报'}</strong>
                    <small>{item.summary || item.description || item.badge || '招生素材'}</small>
                    <small>{item.category || item.badge || item.placement || 'admissions'}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="small-note">暂无招生海报素材。</div>
          )}
        </section>
        <div className="feature-split home-public-layout">
          <div className="panel home-course-panel">
            <div className="home-course-grid">
              {publicCourseList.length === 0 && !publicCoursesLoading ? <div className="small-note">{UI_COPY.empty.noPublicCourses}</div> : null}
              {publicCourseList.slice(0, 3).map((course) => {
                const display = getCourseDisplay(course);
                const isSelected = `${course.id}`.trim() === `${selectedPublicCourseId}`;
                return (
                  <article className="learning-card" key={course.id || display.name}>
                    <strong>{display.name}</strong>
                    <p>{normalizeCourseFee(course)}</p>
                    <div className="course-meta-row">
                      <span>班型：{display.classType}</span>
                      <span>时间：{display.time}</span>
                    </div>
                    <small>{course.grade || '年级待录入'} · 可预约试听</small>
                    <button
                      className={isSelected ? 'row-action ghost' : 'row-action'}
                      onClick={() => setSelectedPublicCourseId(`${course.id}`)}
                    >
                      {isSelected ? '已选中试听课程' : '立即预约试听'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="panel encouragement-panel home-consult-panel">
            <div className="section-headline">
              <div>
                <span>试听咨询</span>
                <h3>已选课程摘要</h3>
              </div>
            </div>
            {selectedPublicCourse && selectedPublicCourseDisplay ? (
              <div className="alert-list" style={{ marginBottom: 10 }}>
                <div className="alert-row">
                  <span className="status-dot blue" />
                  <div>
                    <strong>{selectedPublicCourseDisplay.name}</strong>
                    <small>{selectedPublicCourse.grade || '年级待录入'} · 班型：{selectedPublicCourseDisplay.classType} · {selectedPublicCourseDisplay.time}</small>
                    <small>{normalizeCourseFee(selectedPublicCourse)} · 课程ID：{selectedPublicCourse.id}</small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="small-note">请先选择试听课程</div>
            )}
            {selectedPublicCourse && selectedPublicCourseRules ? (
              <div className="alert-list" style={{ marginBottom: 10 }}>
                <div className="alert-row">
                  <span className="status-dot green" />
                  <div>
                    <strong>课程详情</strong>
                    <small>上课日期：{selectedPublicCourseRules.scheduleDate}</small>
                    <small>到课规则：{selectedPublicCourseRules.attendanceRule}</small>
                    <small>保留规则：{selectedPublicCourseRules.holdRule}</small>
                  </div>
                  <small className="small-note">
                    {selectedPublicCourseDisplay.classType} · {selectedPublicCourseDisplay.time}
                  </small>
                </div>
              </div>
            ) : null}
            <label>
              <span>家长姓名</span>
              <input value={trialGuardianName} onChange={(event) => setTrialGuardianName(event.target.value)} />
            </label>
            <div className="hero-chip-row" style={{ marginTop: 8 }}>
              <button className="row-action" onClick={handleSubmitTrialLead} disabled={publicLeadSubmitting || trialBusy}>
                {publicLeadSubmitting || trialBusy ? '提交中...' : '提交咨询'}
              </button>
              <button className="row-action" onClick={handleSubmitTrialBooking} disabled={!trialLeadId || trialBusy}>
                提交试听预约
              </button>
            </div>
            <div className="hero-chip-row" style={{ marginTop: 8 }}>
              <span className="small-note">咨询状态：{trialStatusText}</span>
              <span className="small-note">线索ID：{trialLeadId || '—'}</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function PlatformAdmin({
  organizations = [],
  orgActionsByStatus = {},
  orgStatusDefaults = {},
  onApplyOrgAction,
  onAction,
  onRefresh,
  onCreateOrg,
  actionBusyOrgId = '',
  statusMessage
}) {
  const [orgs, setOrgs] = useState(() => organizations.map((org) => ({ ...org })));
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftOrgName, setDraftOrgName] = useState('');
  const [draftOrgMessage, setDraftOrgMessage] = useState('');

  useEffect(() => {
    setOrgs(organizations.map((org) => ({ ...org })));
  }, [organizations]);

  const nextDate = (base, dayOffset) => {
    const date = new Date(base);
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().slice(0, 10);
  };

  const getOrgActions = (org) => {
    const actions = orgActionsByStatus[org.status] || ORG_ACTIONS_BY_STATUS[org.status] || [];
    const defaultsSet = { ...ORG_STATUS_DEFAULTS, ...orgStatusDefaults };
    const today = new Date().toISOString().slice(0, 10);

    const applyOrgAction = async (action) => {
      const defaults = defaultsSet[action.targetStatus] || {};
      const patch = {
        status: action.targetStatus,
        ...(defaults || {}),
        ...(action.patch || {})
      };

      if (Object.prototype.hasOwnProperty.call(defaults, 'dayOffset')) {
        patch.expires = nextDate(today, defaults.dayOffset);
      }
      delete patch.dayOffset;
      onAction?.('platform', `执行机构动作：${action.label}`);

      if (typeof onApplyOrgAction === 'function') {
        await onApplyOrgAction(org, action, patch);
        return;
      }

      setOrgs((prev) =>
        prev.map((item) => ((item.id || item.name) === (org.id || org.name) ? { ...item, ...patch } : item))
      );
    };

    return (
      <span className="org-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            className="row-action"
            onClick={() => applyOrgAction(action)}
            disabled={actionBusyOrgId && ((actionBusyOrgId === (org.id || org.name)))}
          >
            {action.label}
          </button>
        ))}
      </span>
      );
    };

  const addTrialOrg = async () => {
    const name = draftOrgName.trim();
    if (!name) {
      setDraftOrgMessage('请输入机构名称');
      return;
    }

    try {
      if (typeof onCreateOrg === 'function') {
        await onCreateOrg({ name });
      } else {
        const today = new Date();
        const expireDate = new Date(today);
        expireDate.setDate(today.getDate() + PLATFORM_TRIAL_ORG_LIMITS.trialDays);

        const nextOrg = {
          id: `org_${Date.now()}`,
          name,
          plan: '体验版',
          planCode: 'trial',
          planMode: '试用',
          students: 0,
          teachers: 0,
          limitStudents: PLATFORM_TRIAL_ORG_LIMITS.students,
          limitTeachers: PLATFORM_TRIAL_ORG_LIMITS.teachers,
          aiUsed: PLATFORM_TRIAL_ORG_LIMITS.aiUsed,
          aiLimit: PLATFORM_TRIAL_ORG_LIMITS.aiLimit,
          expires: expireDate.toISOString().slice(0, 10),
          status: ORG_STATUS.trial,
          expiryAction: '到期后冻结，待开通月费/年费',
          createdAt: today.toISOString(),
          updatedAt: today.toISOString()
        };

        setOrgs((prev) => [nextOrg, ...prev]);
      }
      setDraftOrgMessage(`已创建机构【${name}】并进入试用14天`);
      setDraftOrgName('');
      setShowAddForm(false);
      onAction?.('platform', `新增试用机构：${name}`);
    } catch (error) {
      setDraftOrgMessage(error?.message || '创建机构失败');
    }
  };

  return (
    <section className="role-grid">
      <div className="panel wide">
        <PanelTitle icon={Building2} title="平台机构管理（试用/到期可控）" />
        <div className="platform-admin-actions">
          <button
            className="row-action"
            onClick={() => {
              onAction?.('platform', '刷新机构列表');
              onRefresh?.();
            }}
            disabled={!onRefresh || actionBusyOrgId === 'platform:create'}
          >
            刷新机构列表
          </button>
          <button className="row-action" onClick={() => setShowAddForm((value) => !value)}>
            {showAddForm ? '收起新增表单' : '新增试用机构'}
          </button>
        </div>
        {(statusMessage || draftOrgMessage) ? <p className="small-note">{draftOrgMessage || statusMessage}</p> : null}
        {showAddForm ? (
          <div className="platform-admin-add-form">
            <label>
              <span>新机构名称</span>
              <input
                value={draftOrgName}
                onChange={(event) => setDraftOrgName(event.target.value)}
                placeholder="例如：华彩英语"
              />
            </label>
            <button className="row-action" onClick={addTrialOrg} disabled={actionBusyOrgId === 'platform:create'}>
              {actionBusyOrgId === 'platform:create' ? '创建中...' : '创建试用机构'}
            </button>
          </div>
        ) : null}
        <div className="org-table">
          {orgs.map((org) => (
            <div className="org-row" key={org.id || org.name}>
              <div>
                <strong>{org.name}</strong>
                <small>
                  {org.plan}（{org.planMode}） · {org.students}/{org.limitStudents} 学员 · {org.teachers}/{org.limitTeachers} 老师
                  <br />
                  到期 {org.expires} · AI {org.aiUsed}/{org.aiLimit}
                </small>
              </div>
              <span className={`pill ${org.status === ORG_STATUS.trial ? 'trial' : org.status === ORG_STATUS.expired ? 'danger' : ''}`}>
                {org.status}
              </span>
              <div className="small-note" style={{ justifySelf: 'end', textAlign: 'right' }}>
                到期策略：{org.expiryAction}
              </div>
              {getOrgActions(org)}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={DatabaseZap} title="平台运行边界" />
        <ul className="check-list">
          <li><Check size={16} /> 每条业务数据绑定 institutionId</li>
          <li><Check size={16} /> 学生、老师、AI次数超额自动提示并降级处理</li>
          <li><Check size={16} /> 到期机构自动转为只读/冻结（平台可配置）</li>
          <li><Check size={16} /> 平台管理员保留跨机构审计与停用权限</li>
        </ul>
      </div>
    </section>
  );
}

function PlatformOverview({ platformSummary = {}, organizations = [], onExportReport, warningOrganizations = [], onAcknowledgeWarnings }) {
  const summary = platformSummary || {};
  const studentCount = organizations.reduce((sum, item) => sum + (Number(item.students) || 0), 0);
  const teacherCount = organizations.reduce((sum, item) => sum + (Number(item.teachers) || 0), 0);
  const trialCount = organizations.filter((item) => item.status === ORG_STATUS.trial).length;
  const expiredCount = organizations.filter((item) => item.status === ORG_STATUS.expired).length;
  const normalCount = organizations.filter((item) => item.status === ORG_STATUS.normal).length;

  return (
    <section className="role-grid">
      <div className="hero-panel">
        <div>
          <div className="platform-hero-kicker">机构监管台</div>
          <h1>机构状态总览</h1>
          <p>统一查看机构开通、到期、资源用量与权限边界，减少漏管控。</p>
          <div className="hero-actions platform-hero-actions">
            <button onClick={onAcknowledgeWarnings} disabled={warningOrganizations.length === 0}>
              今日异常检查
            </button>
            <button className="ghost" onClick={onExportReport}>
              导出运营周报
            </button>
          </div>
          <div className="platform-hero-strip">
            <span>到期预警</span>
            <span>机构续用管理</span>
            <span>资源用量监控</span>
            <span>权限边界审计</span>
          </div>
      </div>
        <div className="orbit-card">
          <ShieldCheck />
          <strong>当前运行基线</strong>
          <span>{summary.currentPlanName || '标准版'}</span>
          <small>课时 / 资源 / 师资边界自动提示</small>
          <small>{summary.studentUsageText || '0 / 0 学员'}</small>
        </div>
      </div>

      <div className="metrics">
        <MetricCard icon={Building2} label="机构数" value={organizations.length} note="平台总机构" />
        <MetricCard icon={Crown} label="正常运营" value={normalCount} note="未到期机构" />
        <MetricCard icon={BadgeCheck} label="试用中" value={trialCount} note="14 天窗口期" />
        <MetricCard icon={AlertTriangle} label="已到期" value={expiredCount} note="被冻结/待恢复" tone="red" />
      </div>

      <div className="panel wide">
        <PanelTitle icon={Users} title="容量快照" />
        <div className="platform-snapshot-grid">
          <div className="platform-snapshot-card">
            <strong>{studentCount}</strong>
            <small>在学学员</small>
          </div>
          <div className="platform-snapshot-card">
            <strong>{teacherCount}</strong>
            <small>在岗老师</small>
          </div>
          <div className="platform-snapshot-card">
            <strong>{trialCount}</strong>
            <small>试用中机构</small>
          </div>
          <div className="platform-snapshot-card">
            <strong>{expiredCount}</strong>
            <small>已到期机构</small>
          </div>
        </div>
        <div className="platform-snapshot-note">到期提醒自动提示，过期后转只读并保留历史审核记录。</div>
      </div>

      {warningOrganizations.length > 0 ? (
        <div className="panel">
          <PanelTitle
            icon={AlertTriangle}
            title="平台风险预警"
            action={<button onClick={onAcknowledgeWarnings}>处理到期风险</button>}
          />
          {warningOrganizations.map((org) => {
            const left = daysToDate(org.expires);
            const leftText = Number.isFinite(left) ? `${Math.max(left, 0)} 天` : '到期日期待更新';
            return (
              <div className="small-note" key={org.id || org.name}>
                {org.name} · {org.plan}（{org.planMode}）· 到期 {org.expires}（还剩 {leftText}）· {org.expiryAction}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function PlatformPlansPage({
  organizations = [],
  orgStatusDefaults = {},
  orgActionsByStatus = {},
  platformSummary = {}
}) {
  const orgList = Array.isArray(organizations) ? organizations : [];
  const statusEntries = Object.entries(orgStatusDefaults || {});
  const actionEntries = Object.entries(orgActionsByStatus || {});
  const groupedOrganizations = statusEntries.map(([status]) => ({
    status,
    items: orgList.filter((org) => `${org.status || ''}`.trim() === status || `${org.planMode || ''}`.trim() === status)
  }));

  return (
    <section className="role-grid">
      <div className="panel wide">
        <PanelTitle icon={CreditCard} title="机构策略总览" />
        <div className="summary-grid">
          {statusEntries.map(([status, defaults]) => (
            <article className="summary-card" key={status}>
              <strong>{status}</strong>
              <span>{defaults.plan || defaults.planMode || '试用/正式'}</span>
              <small>{defaults.expiryAction || '到期后只读'}</small>
              <small>试用期：{defaults.dayOffset || 0} 天</small>
            </article>
          ))}
          <article className="summary-card">
            <strong>当前机构</strong>
            <span>{platformSummary.currentPlanName || '待确认'}</span>
            <small>{platformSummary.studentUsageText || '暂无机构用量摘要'}</small>
            <small>仅作内部策略参考</small>
          </article>
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={Rocket} title="状态规则" />
        <ul className="check-list">
          {actionEntries.map(([status, actions]) => (
            <li key={status}>
              <Check size={16} /> {status}：{actions.map((action) => action.label).join(' / ')}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel wide">
        <PanelTitle icon={Building2} title="机构样例" />
        <div className="org-table">
          {groupedOrganizations.flatMap((group) => group.items.map((org) => (
            <div className="org-row" key={`${group.status}-${org.id || org.name}`}>
              <div>
                <strong>{org.name || '未命名机构'}</strong>
                <small>状态：{org.status || group.status || 'trial'} · 套餐：{org.plan || '体验版'}</small>
                <small>到期：{org.expires || '未设置'} · 机构ID：{org.id || '—'}</small>
              </div>
              <div className="small-note" style={{ justifySelf: 'end', textAlign: 'right' }}>
                <div>学员 {org.students || 0} / {org.limitStudents || 0}</div>
                <div>老师 {org.teachers || 0} / {org.limitTeachers || 0}</div>
              </div>
            </div>
          )))}
          {groupedOrganizations.every((group) => group.items.length === 0) ? (
            <div className="small-note">当前没有可显示的机构样例</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PlatformAiPage({
  organizations = [],
  sourcePage = 'platform-ai',
  sourcePageLabel = '机构运营智能体中心',
  aiSourceLabel = APP_COPY.simulatedText,
  aiProvider = 'mock',
  aiBaseUrl = '',
  aiModel = 'mock',
  aiUsageData = {},
  aiUsageLoading = false,
  aiUsageMessage = '',
  aiUsageFilters = {},
  onAiUsageFiltersChange,
  onRetryAiUsage,
  onExportAiUsage,
  auditData = {},
  auditLoading = false,
  auditMessage = '',
  auditFilters = {},
  onAuditFiltersChange,
  onRetryAudit,
  onExportAudit,
  onLoadMoreAudit,
  canLoadMoreAudit = false
}) {
  const fallbackUsageRows = organizations.map((org) => ({
    institutionId: org.id || org.name || '',
    institutionName: org.name || '机构名称待补齐',
    plan: org.plan || '体验版',
    planCode: org.planCode || 'trial',
    aiLimitMonthly: Number(org.aiLimit) || 0,
    aiUsedWindow: Number(org.aiUsed) || 0,
    aiUsedMonth: Number(org.aiUsed) || 0,
    requestsWindow: Number(org.requestsWindow) || 0,
    lastUsedAt: org.lastUsedAt || '',
    aiLeftMonth: Math.max((Number(org.aiLimit) || 0) - (Number(org.aiUsed) || 0), 0),
  }));

  const usageRows = Array.isArray(aiUsageData?.items) ? aiUsageData.items : [];
  const topUsers = Array.isArray(aiUsageData?.topUsers) ? aiUsageData.topUsers : [];
  const platformSourceSummary = isApiMode() ? (aiUsageData?.sourceSummary || null) : null;
  const sourceRows = isApiMode() ? usageRows : fallbackUsageRows;
  const listByUsage = [...sourceRows]
    .sort((left, right) => {
      const leftUsed = Number(left.aiUsedWindow) || Number(left.aiUsed) || Number(left.aiUsedMonth) || 0;
      const rightUsed = Number(right.aiUsedWindow) || Number(right.aiUsed) || Number(right.aiUsedMonth) || 0;
      return rightUsed - leftUsed;
    })
    .slice(0, 6);

  const totalInstitutions = isApiMode() ? Number(aiUsageData?.totalInstitutions || 0) : organizations.length;
  const selectedInstitution = sourceRows.find(
    (item) => item.institutionId === (aiUsageFilters?.institutionId || '')
  );
  const currentWindow = aiUsageData?.window || {};
  const hasDateWindow = !!currentWindow.startAt || !!currentWindow.endAt;

  const limitText = hasDateWindow
    ? `${currentWindow.startAt || ''} ~ ${currentWindow.endAt || '现在'}`
    : `${aiUsageFilters?.days || 30}天窗口`;

  const auditRows = Array.isArray(auditData?.items) ? auditData.items : [];
  const currentTotal = Number(auditData?.total || 0);
  const currentOffset = Number(auditData?.offset || 0);
  const currentLimit = Number(auditData?.limit || 0);
  const isMockMode = !isApiMode();
  const displayCount = Math.min(currentOffset + currentLimit, currentTotal);
  const [trendWindowDays, setTrendWindowDays] = useState(7);
  const [trendAlertThreshold, setTrendAlertThreshold] = useState(35);
  const [sourceMockAlertThreshold, setSourceMockAlertThreshold] = useState(35);
  const [sourceUnknownAlertThreshold, setSourceUnknownAlertThreshold] = useState(15);
  const usageSourceKpi = sourceRows.reduce((acc, item) => {
    const sourceCategory = getAIAuditSourceCategory(item.source || aiSourceLabel);
    const requestCount = Number(item.requestsWindow) || Number(item.requests) || Number(item.aiRequests) || 0;
    acc.orgsBySource[sourceCategory] = (acc.orgsBySource[sourceCategory] || 0) + 1;
    acc.requestBySource[sourceCategory] = (acc.requestBySource[sourceCategory] || 0) + requestCount;
    acc.totalRequests += requestCount;
    return acc;
  }, {
    orgsBySource: { real: 0, mock: 0, unknown: 0 },
    requestBySource: { real: 0, mock: 0, unknown: 0 },
    totalRequests: 0
  });

  const sourceKpi = platformSourceSummary?.totalRequests > 0 ? {
    real: Number(platformSourceSummary.realRequests || 0),
    mock: Number(platformSourceSummary.mockRequests || 0),
    unknown: Number(platformSourceSummary.unknownRequests || 0),
    total: Number(platformSourceSummary.totalRequests || 0)
  } : {
    real: usageSourceKpi.requestBySource.real || 0,
    mock: usageSourceKpi.requestBySource.mock || 0,
    unknown: usageSourceKpi.requestBySource.unknown || 0,
    total: usageSourceKpi.totalRequests || 0
  };

  const auditDecisionKpi = auditRows.reduce((acc, item) => {
    const decisionCategory = getAIDecisionCategory(item.decision);
    if (decisionCategory === 'allowed' || decisionCategory === 'denied' || decisionCategory === 'mock') {
      acc[decisionCategory] += 1;
    }
    return acc;
  }, { allowed: 0, denied: 0, mock: 0 });

  const trendWindow = trendWindowDays;
  const trendDateKeys = getRecentDateKeys(trendWindow);
  const trendBase = trendDateKeys.reduce((acc, key) => {
    acc[key] = { date: key, allowed: 0, denied: 0, mock: 0, total: 0 };
    return acc;
  }, {});
  const auditDecisionTrend = auditRows.reduce((acc, item) => {
    const dateKey = formatDateKey(item.createdAt);
    if (!dateKey || !acc[dateKey]) {
      return acc;
    }
    const category = getAIDecisionCategory(item.decision);
    if (category === 'allowed' || category === 'denied' || category === 'mock') {
      acc[dateKey][category] += 1;
      acc[dateKey].total += 1;
    }
    return acc;
  }, trendBase);
  const sourceMix = sourceKpi;
  const sourceRealPercent = sourceMix.total > 0 ? Math.round((sourceMix.real / sourceMix.total) * 100) : 0;
  const sourceMockPercent = sourceMix.total > 0 ? Math.round((sourceMix.mock / sourceMix.total) * 100) : 0;
  const sourceUnknownPercent = sourceMix.total > 0 ? Math.round((sourceMix.unknown / sourceMix.total) * 100) : 0;
  const sourceMixHasRisk = sourceMix.total > 0
    && (sourceMockPercent >= sourceMockAlertThreshold || sourceUnknownPercent >= sourceUnknownAlertThreshold);
  const sourceSummaryForExport = {
    totalRequests: sourceMix.total,
    realRequests: sourceMix.real,
    mockRequests: sourceMix.mock,
    unknownRequests: sourceMix.unknown,
    realPercent: sourceRealPercent,
    mockPercent: sourceMockPercent,
    unknownPercent: sourceUnknownPercent,
    mockAlertThreshold: sourceMockAlertThreshold,
    unknownAlertThreshold: sourceUnknownAlertThreshold,
    sourceMixHasRisk
  };
  const currentPreset = normalizeProviderPreset(aiProvider, aiBaseUrl, aiModel);
  const [selectedPresetKey, setSelectedPresetKey] = useState(currentPreset.key);
  useEffect(() => {
    setSelectedPresetKey(currentPreset.key);
  }, [currentPreset.key]);
  const selectedPreset = AI_PROVIDER_PRESETS.find((preset) => preset.key === selectedPresetKey) || currentPreset;
  const runtimeContextLabel = `${getRoleLabel(activeRole || 'student')} / ${sourcePageLabel || sourcePage || '智能体中心'} / ${aiProvider || 'mock'} / ${aiModel || 'mock'}`;
  const agentRunExportColumns = [
    { key: 'id', label: '记录ID' },
    { key: 'role', label: '角色' },
    { key: 'roleLabel', label: '角色名称' },
    { key: 'sourcePage', label: '来源页面' },
    { key: 'sourcePageLabel', label: '来源页面名称' },
    { key: 'aiProvider', label: '模型提供方' },
    { key: 'aiModel', label: '模型名称' },
    { key: 'runtimeContext', label: '运行上下文' },
    { key: 'time', label: '时间' },
    { key: 'agent', label: '智能体' },
    { key: 'action', label: '动作' },
    { key: 'status', label: '状态' },
    { key: 'input', label: '输入' },
    { key: 'output', label: '输出' },
    { key: 'api', label: '接口' },
    { key: 'resultType', label: '结果类型' },
    { key: 'title', label: '标题' },
    { key: 'contentSummary', label: '内容摘要' },
    { key: 'tasksSummary', label: '任务摘要' },
    { key: 'recommendationsSummary', label: '建议摘要' },
    { key: 'factorsSummary', label: '因素摘要' },
    { key: 'score', label: '分数' },
    { key: 'level', label: '等级' },
    { key: 'reward', label: '奖励' },
    { key: 'difficulty', label: '难度' },
    { key: 'riskSummary', label: '风险摘要' }
  ];
  const buildAgentRunExportRecord = (item) => {
    const snapshot = item.outputSnapshot || {};
    return {
      id: item.id || '',
      role: activeRole || '',
      roleLabel: getRoleLabel(activeRole || 'student'),
      sourcePage: sourcePage || '',
      sourcePageLabel: sourcePageLabel || '',
      aiProvider: aiProvider || '',
      aiModel: aiModel || '',
      runtimeContext: runtimeContextLabel,
      time: item.createdAt,
      agent: item.agentName,
      action: item.action,
      status: item.status,
      input: item.input,
      output: item.output,
      channel: item.channel,
      resultType: resolveAgentResultType(snapshot),
      title: snapshot.title || '',
      contentSummary: `${snapshot.content || ''}`.slice(0, 120),
      tasksSummary: Array.isArray(snapshot.tasks) ? snapshot.tasks.slice(0, 3).join(' / ') : '',
      recommendationsSummary: Array.isArray(snapshot.recommendations) ? snapshot.recommendations.slice(0, 3).join(' / ') : '',
      factorsSummary: Array.isArray(snapshot.factors)
        ? snapshot.factors.map((factor) => `${factor.key}:${factor.value}`).slice(0, 3).join(' / ')
        : '',
      score: snapshot.score !== undefined ? snapshot.score : '',
      level: snapshot.level || '',
      reward: snapshot.reward || '',
      difficulty: snapshot.difficulty || '',
      riskSummary: Array.isArray(snapshot.risks)
        ? snapshot.risks.slice(0, 3).map((risk) => `${risk.student}:${risk.risk}`).join(' / ')
        : ''
    };
  };
  const templateProvider = selectedPreset.provider;
  const templateBaseUrl = selectedPreset.baseUrl;
  const templateModel = selectedPreset.model;
  const envTemplate = [
    'AI_MODE=provider',
    `AI_PROVIDER=${templateProvider}`,
    `AI_BASE_URL=${templateBaseUrl}`,
    `AI_MODEL=${templateModel}`,
    'AI_API_KEY=请通过 wrangler secret put AI_API_KEY 注入，不要明文写入仓库'
  ].join('\n');

  const decisionTrendRows = trendDateKeys.map((dateKey) => {
    const day = auditDecisionTrend[dateKey] || { allowed: 0, denied: 0, mock: 0, total: 0 };
    const allowedPercent = day.total > 0 ? Math.round((day.allowed / day.total) * 100) : 0;
    const mockPercent = day.total > 0 ? Math.round((day.mock / day.total) * 100) : 0;
    const deniedPercent = day.total > 0 ? Math.max(0, 100 - allowedPercent - mockPercent) : 0;
    const denyRate = day.total > 0 ? (day.denied / day.total) * 100 : 0;
    return {
      dateKey,
      monthDay: dateKey.slice(5),
      day,
      allowedPercent,
      mockPercent,
      deniedPercent,
      denyRate
    };
  });
  const hasRiskyTrend = decisionTrendRows.some((row) => row.denyRate > trendAlertThreshold);

  return (
    <section className="role-grid">
      <section className="panel wide agent-hero-panel">
        <div className="agent-hero-copy">
          <span>AI 学习工作台</span>
          <h3>AI 学习助手工作台</h3>
          <p>
            把课堂反馈、练习出题、续费风险收口成一个统一入口。
            先选能力，再执行，再看回填记录，所有动作都保留可追踪结果。
          </p>
          <div className="agent-hero-kpis">
            <span>当前角色：{getRoleLabel(activeRole || 'student')}</span>
            <span>可执行能力：{quickStats.executableAgents}/{quickStats.totalAgents}</span>
            <span>最新结果：{quickStats.latestType}</span>
            <span>状态：{quickStats.latestStatus}</span>
          </div>
        </div>
        <div className="agent-hero-side">
          <div className="agent-hero-focus">
            <div className="agent-hero-focus-head">
              <div>
                <strong>{selectedAgent?.name || '未选择能力'}</strong>
                <small>{selectedAgent?.for || '选择智能体能力'}</small>
              </div>
              <span className={`pill tiny ${selectedAgentAction ? 'success' : 'muted'}`}>
                {selectedAgentAction ? '可执行' : '待选择'}
              </span>
            </div>
            <p>{selectedAgent?.desc || '选择后可直接执行并查看结果。'}</p>
            {selectedAgentMeta ? (
              <div className="agent-hero-meta">
                <span>输入：{selectedAgentMeta.input}</span>
                <span>输出：{selectedAgentMeta.output}</span>
                <span>通道：{selectedAgentMeta.channel}</span>
              </div>
            ) : (
              <div className="agent-hero-meta">
                <span>输入：按页面上下文自动补全</span>
                <span>输出：智能体结果</span>
                <span>通道：智能体服务通道</span>
              </div>
            )}
            <div className="agent-hero-action-row">
              <button
                className="row-action"
                onClick={() => {
                  if (selectedAgentAction) {
                    triggerAgent(selectedAgent.name, selectedAgentAction);
                  }
                }}
                disabled={!selectedAgentAction || (runningAgentName && runningAgentName !== selectedAgent?.name)}
              >
                {runningAgentName === selectedAgent?.name ? '执行中...' : selectedAgentAction ? '立即执行' : '未检测到可执行能力'}
              </button>
              <button
                className="row-action ghost"
                onClick={() => setSelectedRunId(selectedRun?.id || '')}
              >
                查看最近结果
              </button>
            </div>
          </div>
          <div className="agent-hero-chips">
            <span>口语反馈</span>
            <span>练习生成</span>
            <span>续费风险</span>
            <span>执行留痕</span>
          </div>
        </div>
      </section>

      <div className="panel wide ai-config-card">
        <PanelTitle
          icon={Sparkles}
          title="模型接入"
          action={
            <button
              className="ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(envTemplate);
                } catch {
                  window.prompt('复制下面这段配置到 .env 或 Pages 环境变量', envTemplate);
                }
              }}
            >
              复制变量
            </button>
          }
        />
        <div className="ai-config-overview">
          <div className="metric">
            <span>当前工作台</span>
            <strong>{sourcePageLabel || sourcePage || '智能体中心'}</strong>
            <small>角色：{getRoleLabel(activeRole || 'student')} · 来源：{aiSourceLabel || APP_COPY.simulatedText}</small>
          </div>
          <div className="metric">
            <span>可执行任务</span>
            <strong>{quickStats.totalAgents}</strong>
            <small>已启用 {quickStats.executableAgents} 个执行路径</small>
          </div>
          <div className="metric">
            <span>最新回写</span>
            <strong>{quickStats.latestType}</strong>
            <small>状态：{quickStats.latestStatus}</small>
          </div>
        </div>
        <div className="ai-provider-pills">
          {AI_PROVIDER_PRESETS.map((preset) => (
            <button
              key={preset.key}
              className={selectedPresetKey === preset.key ? 'pill-select active' : 'pill-select'}
              onClick={() => setSelectedPresetKey(preset.key)}
              type="button"
            >
              <strong>{preset.label}</strong>
              <small>{preset.note}</small>
            </button>
          ))}
        </div>
        <div className="ai-config-summary">
          <div className="metric">
            <span>接入模式</span>
            <strong>{aiSourceLabel || APP_COPY.simulatedText}</strong>
            <small>{selectedPreset.key === 'custom' ? '当前仅支持本地配置' : '已启用云端模型配置'}</small>
          </div>
          <div className="metric">
            <span>提供方</span>
            <strong>{templateProvider}</strong>
            <small>{selectedPreset.key === 'custom' ? '请切换为 provider 预设' : '兼容 OpenAI 接口格式'}</small>
          </div>
          <div className="metric">
            <span>模型</span>
            <strong>{templateModel}</strong>
            <small>{templateBaseUrl}</small>
          </div>
        </div>
        <div className="ai-config-hint">
          <small>说明：系统会根据当前模型供应方自动读取可用配置。</small>
          <small>如需切换云端模型，只更新供应方、地址、模型名和密钥即可。</small>
        </div>
        <pre className="ai-config-template" aria-label="智能体配置模板">{envTemplate}</pre>
      </div>

      <div className="panel wide">
        <PanelTitle
          icon={DatabaseZap}
          title="AI 用量监控（本月）"
          action={
          <button
              className="ghost"
              onClick={() => onExportAiUsage?.({
                sourceSummary: sourceSummaryForExport
              })}
              disabled={aiUsageLoading || sourceRows.length === 0}
            >
              导出机构用量
            </button>
          }
        />
        <div className="audit-filters">
          <select
            value={aiUsageFilters?.days || 30}
            onChange={(e) => onAiUsageFiltersChange?.({ days: Number(e.target.value || 30), offset: 0 })}
            disabled={aiUsageLoading}
          >
            {AI_USAGE_DAYS_OPTIONS.map((day) => (
              <option key={day} value={day}>{`最近 ${day} 天`}</option>
            ))}
          </select>

          <select
            value={aiUsageFilters?.institutionId || ''}
            onChange={(e) => onAiUsageFiltersChange?.({ institutionId: e.target.value, includeUsers: false })}
            disabled={aiUsageLoading}
          >
            <option value="">全部机构</option>
            {organizations.map((org) => (
              <option key={org.id || org.name} value={org.id || ''}>
                {org.name || org.id || '机构名称待补齐'}
              </option>
            ))}
          </select>

          <select
            value={aiUsageFilters?.limit || 50}
            onChange={(e) => onAiUsageFiltersChange?.({ limit: Number(e.target.value || 50) })}
            disabled={aiUsageLoading}
          >
            <option value={20}>每页 20</option>
            <option value={50}>每页 50</option>
            <option value={100}>每页 100</option>
          </select>

          <input
            type="date"
            value={aiUsageFilters?.startAt || ''}
            onChange={(e) => onAiUsageFiltersChange?.({ startAt: e.target.value })}
            disabled={aiUsageLoading}
            aria-label="AI 用量开始时间"
          />

          <input
            type="date"
            value={aiUsageFilters?.endAt || ''}
            onChange={(e) => onAiUsageFiltersChange?.({ endAt: e.target.value })}
            disabled={aiUsageLoading}
            aria-label="AI 用量结束时间"
          />

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: 'max-content' }}>
            <input
              type="checkbox"
              checked={!!aiUsageFilters?.includeUsers}
              onChange={(e) => onAiUsageFiltersChange?.({ includeUsers: e.target.checked })}
              disabled={aiUsageLoading || !aiUsageFilters?.institutionId}
            />
            显示机构Top用户
          </label>

          <select
            value={aiUsageFilters?.userLimit || 20}
            onChange={(e) => onAiUsageFiltersChange?.({ userLimit: Number(e.target.value || 20) })}
            disabled={aiUsageLoading || !aiUsageFilters?.institutionId}
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>

          <button onClick={onRetryAiUsage} disabled={aiUsageLoading}>刷新</button>
        </div>

        <div className="small-note">
          AI来源：
          <span className={`pill tiny ${getAIAuditSourceTone(aiSourceLabel)}`}>
            {getAIAuditSourceLabel(aiSourceLabel)}
          </span>
          {aiUsageLoading ? '，正在刷新 AI 用量...' : aiUsageMessage || `，总计 ${totalInstitutions} 家机构，时间范围：${limitText}`}
        </div>
        <div className="metrics ai-source-kpi">
          <article className="metric">
            <div className="metric-icon">
              <DatabaseZap size={20} />
            </div>
            <span>真实模型请求</span>
            <strong>{sourceKpi.real}</strong>
            <small>来源机构 {usageSourceKpi.orgsBySource.real} 家</small>
          </article>
          <article className="metric">
            <div className="metric-icon">
              <Bot size={20} />
            </div>
            <span>备用模型请求</span>
            <strong>{sourceKpi.mock}</strong>
            <small>来源机构 {usageSourceKpi.orgsBySource.mock} 家</small>
          </article>
          <article className="metric">
            <div className="metric-icon">
              <AlertTriangle size={20} />
            </div>
            <span>AI 拒绝决策</span>
            <strong>{auditDecisionKpi.denied}</strong>
            <small>审计日志内共 {auditRows.length} 条</small>
          </article>
        </div>
        <div className="source-mix-meter">
          <div className="small-note">AI 来源占比（请求） · 总计 {sourceMix.total} 次</div>
          <div className="trend-toolbar">
            <select
              value={sourceMockAlertThreshold}
              onChange={(e) => setSourceMockAlertThreshold(Number(e.target.value))}
              className="tiny-select"
              aria-label="备用模型占比告警阈值"
              title="备用模型占比告警阈值"
            >
              <option value={20}>备用模型告警 20%</option>
              <option value={30}>备用模型告警 30%</option>
              <option value={35}>备用模型告警 35%</option>
              <option value={40}>备用模型告警 40%</option>
            </select>
            <select
              value={sourceUnknownAlertThreshold}
              onChange={(e) => setSourceUnknownAlertThreshold(Number(e.target.value))}
              className="tiny-select"
              aria-label="来源未知占比告警阈值"
              title="来源未知占比告警阈值"
            >
              <option value={5}>未知告警 5%</option>
              <option value={10}>未知告警 10%</option>
              <option value={15}>未知告警 15%</option>
              <option value={20}>未知告警 20%</option>
            </select>
          </div>
          {sourceMixHasRisk ? (
            <div className="small-note danger">
              来源占比异常：备用模型 {sourceMockPercent}%（阈值 {sourceMockAlertThreshold}%）或来源未知 {sourceUnknownPercent}%（阈值 {sourceUnknownAlertThreshold}%）超过告警线，请检查模型降级与采集链路。
            </div>
          ) : null}
          <div className="stacked-meter">
            <span
              className="stacked-segment success"
              style={{ width: `${sourceRealPercent}%` }}
              title={`真实模型 ${sourceRealPercent}%`}
            />
            <span
              className="stacked-segment warn"
              style={{ width: `${sourceMockPercent}%` }}
              title={`备用模型 ${sourceMockPercent}%`}
            />
            <span
              className="stacked-segment muted"
              style={{ width: `${sourceUnknownPercent}%` }}
              title={`来源未知 ${sourceUnknownPercent}%`}
            />
          </div>
          <div className="source-mix-caption">
            <small>真实模型 {sourceRealPercent}%</small>
            <small>备用模型 {sourceMockPercent}%</small>
            <small>来源未知 {sourceUnknownPercent}%</small>
          </div>
        </div>
        <div className="audit-filters status-legend" aria-label="AI来源与决策说明">
          <span className="small-note" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '10px' }}>
            来源标识：
          </span>
          <span className="pill tiny success">真实模型</span>
          <span className="pill tiny warn">备用模型</span>
          <span className="pill tiny muted">来源未知</span>
          <span style={{ width: '100%', display: 'block', height: 0 }} />
          <span className="small-note" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '10px' }}>
            决策标识：
          </span>
          <span className="pill tiny success">允许</span>
          <span className="pill tiny warn">备用模型</span>
          <span className="pill tiny danger">拒绝</span>
        </div>
        <div className="decision-trend">
          <div className="small-note">AI 决策趋势（最近 {trendWindowDays} 天）</div>
          <div className="trend-toolbar">
            <select
              value={trendAlertThreshold}
              onChange={(e) => setTrendAlertThreshold(Number(e.target.value))}
              className="tiny-select"
              aria-label="趋势拒绝率告警阈值"
              title="拒绝率告警阈值"
            >
              <option value={20}>告警阈值 20%</option>
              <option value={30}>告警阈值 30%</option>
              <option value={35}>告警阈值 35%</option>
              <option value={40}>告警阈值 40%</option>
            </select>
            <button
              className={trendWindowDays === 7 ? 'row-action ghost' : 'row-action'}
              onClick={() => setTrendWindowDays(7)}
            >
              最近 7 天
            </button>
            <button
              className={trendWindowDays === 14 ? 'row-action ghost' : 'row-action'}
              onClick={() => setTrendWindowDays(14)}
            >
              最近 14 天
            </button>
            <button
              className={trendWindowDays === 30 ? 'row-action ghost' : 'row-action'}
              onClick={() => setTrendWindowDays(30)}
            >
              最近 30 天
            </button>
          </div>
          {hasRiskyTrend ? (
            <div className="small-note danger">
              检测到最近 {trendWindowDays} 日内存在拒绝率超过 {trendAlertThreshold}% 的风险日，请检查提示词配置或风控规则。
            </div>
          ) : null}
          <div className="trend-grid">
            {decisionTrendRows.map((item) => (
              <div className="trend-day" key={item.dateKey}>
                <span>{item.monthDay}</span>
                <div className="trend-stack">
                  <span className="trend-segment success" style={{ width: `${item.allowedPercent}%` }} title={`允许 ${item.allowedPercent}%`} />
                  <span className="trend-segment warn" style={{ width: `${item.mockPercent}%` }} title={`备用模型 ${item.mockPercent}%`} />
                  <span className="trend-segment danger" style={{ width: `${item.deniedPercent}%` }} title={`拒绝 ${item.day.denied} 条`} />
                </div>
                <small>{item.day.allowed}/{item.day.mock}/{item.day.denied}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="org-table">
          {listByUsage.length === 0 ? (
            <div className="small-note">未返回 AI 使用数据</div>
          ) : (
            listByUsage.map((org) => {
              const limit = Number(org.aiLimitMonthly) || Number(org.aiLimit) || 0;
              const used = Number(org.aiUsedWindow) || Number(org.aiUsed) || Number(org.aiUsedMonth) || 0;
              const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
              return (
                <div className="org-row" key={org.institutionId || org.id || org.name || org.institutionName || 'ai-usage'}>
                <div>
                  <strong>{org.institutionName || org.name || '机构名称待补齐'}</strong>
                  <small>{org.plan || '体验版'}（{org.planMode || '月付'}） · 已用 {used} / 上限 {limit}</small>
                  <small>
                    请求数 {Number(org.requestsWindow) || 0} · 上次使用 {org.lastUsedAt || '—'} · 来源
                    <span className={`pill tiny ${getAIAuditSourceTone(org.source || aiSourceLabel)}`}>
                      {getAIAuditSourceLabel(org.source || aiSourceLabel)}
                    </span>
                  </small>
                </div>
                  <span className={`pill ${percent >= 90 ? 'danger' : ''}`}>{percent}%</span>
                  <div className="small-note" style={{ justifySelf: 'end', textAlign: 'right' }}>
                    余额 {Math.max(limit - used, 0)} 次
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel">
        <PanelTitle icon={Trophy} title="AI 运营策略" />
        <ul className="check-list">
          <li><Check size={16} /> 大额机构优先开通年付，降低月度波动</li>
          <li><Check size={16} /> 超阈值机构自动弹窗人工确认</li>
          <li><Check size={16} /> AI 配额不足时降级为低频生成模式</li>
        </ul>
      </div>

      {topUsers.length > 0 ? (
        <div className="panel wide">
          <PanelTitle
            icon={Users}
            title={`机构用户 TOP (${selectedInstitution?.institutionName || '当前机构'})`}
            action={
              <span className="small-note">
                Top 用户趋势（时间窗口：{limitText}）
              </span>
            }
          />
          <div className="org-table">
            {topUsers.map((user) => (
              <div className="org-row" key={`${user.userId}-${user.lastUsedAt}`}>
                <div>
                  <strong>{user.userName || '匿名用户'}</strong>
                  <small>角色：{user.role || '—'} · 用户ID：{user.userId || '—'}</small>
                  <small>上次访问：{user.lastUsedAt || '—'}</small>
                </div>
                <span className="pill">{Number(user.requestsWindow) || 0}次请求</span>
                <div className="small-note" style={{ justifySelf: 'end', textAlign: 'right' }}>
                  Tokens: {Number(user.aiUsedWindow) || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="panel wide">
        <PanelTitle
          icon={DatabaseZap}
          title="AI 审计日志"
          action={
            <div className="audit-toolbar">
              <button
                onClick={() => {
                  onRetryAudit?.();
                }}
                disabled={auditLoading}
              >
                刷新
              </button>
              <button
                className="ghost"
                onClick={onExportAudit}
                disabled={auditLoading || auditRows.length === 0}
              >
                导出当前列表
              </button>
            </div>
          }
        />
        <div className="audit-filters">
          <input
            type="text"
            placeholder="用户ID"
            value={auditFilters?.userId || ''}
            onChange={(e) => onAuditFiltersChange?.({ userId: e.target.value, offset: 0 })}
            disabled={auditLoading}
          />

          <input
            type="text"
            placeholder="客户端IP"
            value={auditFilters?.clientIp || ''}
            onChange={(e) => onAuditFiltersChange?.({ clientIp: e.target.value, offset: 0 })}
            disabled={auditLoading}
          />

          <select
            value={auditFilters?.institutionId || ''}
            onChange={(e) => onAuditFiltersChange?.({ institutionId: e.target.value, offset: 0 })}
            disabled={auditLoading}
          >
            <option value="">全部机构</option>
            {organizations.map((org) => (
              <option key={org.id || org.name} value={org.id || ''}>
                {org.name || org.id || '机构名称待补齐'}
              </option>
            ))}
          </select>

          <select
            value={auditFilters?.action || ''}
            onChange={(e) => onAuditFiltersChange?.({ action: e.target.value, offset: 0 })}
            disabled={auditLoading}
          >
            {AI_AUDIT_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={auditFilters?.decision || ''}
            onChange={(e) => onAuditFiltersChange?.({ decision: e.target.value, offset: 0 })}
            disabled={auditLoading}
          >
            {AI_AUDIT_DECISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={auditFilters?.startAt || ''}
            onChange={(e) => onAuditFiltersChange?.({ startAt: e.target.value, offset: 0 })}
            disabled={auditLoading}
            aria-label="开始时间"
          />

          <input
            type="date"
            value={auditFilters?.endAt || ''}
            onChange={(e) => onAuditFiltersChange?.({ endAt: e.target.value, offset: 0 })}
            disabled={auditLoading}
            aria-label="结束时间"
          />

          <select
            value={auditFilters?.limit || 20}
            onChange={(e) => onAuditFiltersChange?.({ limit: e.target.value, offset: 0 })}
            disabled={auditLoading}
          >
            <option value={10}>每页 10 条</option>
            <option value={20}>每页 20 条</option>
            <option value={50}>每页 50 条</option>
          </select>
        </div>

        <div className="audit-note small-note">
          {isMockMode ? '当前处于本地预览模式' : null}
          {auditLoading
            ? '正在加载审计日志'
            : auditMessage
              ? auditMessage
              : `共 ${currentTotal} 条，已显示 ${displayCount} 条`}
        </div>

        <div className="org-table audit-table">
          {auditLoading && auditRows.length === 0 ? (
            <div className="small-note">正在获取审计日志...</div>
          ) : auditRows.length === 0 ? (
            <div className="small-note">{UI_COPY.empty.noAuditRecords}</div>
          ) : (
            auditRows.map((item) => (
              <div className="org-row audit-row" key={item.id || `${item.institutionId}-${item.createdAt}`}>
                <div>
                  <strong>{item.institutionName || '平台动作'}</strong>
                  <small>机构：{item.institutionId || '—'}</small>
                  <small>IP：{item.clientIp || '—'}</small>
                </div>
                <div>
                  <strong>{item.action}</strong>
                  <small>{item.role} / 用户 {item.userId || '—'}</small>
                  <small>
                    请求来源：
                    <span className={`pill tiny ${getAIAuditSourceTone(item.source)}`}>
                      {getAIAuditSourceLabel(item.source)}
                    </span>
                  </small>
                </div>
                <small>
                  决策：
                  <span className={`pill tiny ${getAIDecisionTone(item.decision)}`}>
                    {getAIAuditDecisionLabel(item.decision)}
                  </span>
                </small>
                <div>
                  <strong>时间</strong>
                  <small>{item.createdAt || '—'}</small>
                </div>
                <div>
                  <strong>延迟 / Tokens</strong>
                  <small>{`${Number(item.latencyMs || 0)}ms / ${Number(item.tokensUsed || 0)}次`}</small>
                </div>
                <small>理由：{item.reason || '—'}</small>
                <small className="audit-payload">
                  请求：{item.requestPayload ? `${item.requestPayload.slice(0, 140)}${item.requestPayload.length > 140 ? '...' : ''}` : '—'}
                </small>
              </div>
            ))
          )}
        </div>

        {canLoadMoreAudit ? (
          <div style={{ marginTop: 12 }}>
            <button className="row-action" onClick={onLoadMoreAudit} disabled={auditLoading}>加载更多</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LandingAndPricing({ billingPlans = [] }) {
  return (
    <section className="landing">
      <div className="landing-copy">
        <h2>给英语机构的 AI 经营系统，不只是官网</h2>
        <p>
          从小学一年级到高三，围绕招生、学员、老师、课时、续费和家校沟通，
          把创始人脑子里的管理经验沉淀为可复制流程。
        </p>
      </div>
      <div className="pricing-grid">
        {billingPlans.map((plan) => (
          <article className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
            <span>{plan.name}</span>
            <strong>{plan.priceMonthly} / 月 · {plan.priceYearly} / 年</strong>
            <small>{plan.period}</small>
            <small>{plan.desc}</small>
            <ul>
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function resolveAgentAction(agent, activeRole = '') {
  const actionMap = {
    星语官: 'feedback_from_lesson',
    星练官: 'exercise_generate',
    星守官: 'renewal_risk_scan'
  };
  const action = actionMap[`${agent?.name || ''}`] || '';
  if (activeRole === 'platform') {
    return action === 'renewal_risk_scan' ? action : '';
  }
  if (activeRole === 'founder' || activeRole === 'teacher') {
    return action;
  }
  return '';
}

function resolveAgentPayload(action) {
  if (action === 'feedback_from_lesson') {
    return {
      studentName: '小宇',
      student: '小宇',
      grade: '五年级',
      topic: '课堂内容回顾'
    };
  }

  if (action === 'exercise_generate') {
    return {
      studentName: '小宇',
      grade: '五年级',
      level: '中',
      topic: '词汇与阅读'
    };
  }

  if (action === 'renewal_risk_scan') {
    return {
      institutionId: 'inst-star'
    };
  }

  return {};
}

const AI_PROVIDER_PRESETS = [
  {
    key: 'custom',
    label: '自定义',
    provider: '自定义提供方',
    baseUrl: 'https://provider.example/v1',
    model: '自定义模型',
    note: '仅用于模板展示'
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    note: '常见 OpenAI 兼容格式'
  },
  {
    key: 'qwen',
    label: 'Qwen',
    provider: 'qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    note: '阿里云兼容接口'
  },
  {
    key: 'moonshot',
    label: 'Moonshot',
    provider: 'moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    note: '适合快速对接'
  },
  {
    key: 'doubao',
    label: '豆包',
    provider: 'doubao',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'ep-202406',
    note: '字节火山 OpenAI 兼容格式'
  },
  {
    key: 'zhipu',
    label: '智谱',
    provider: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-plus',
    note: '智谱兼容接口'
  }
];

function normalizeProviderPreset(provider = '', baseUrl = '', model = '') {
  const normalizedProvider = `${provider || ''}`.trim().toLowerCase();
  return AI_PROVIDER_PRESETS.find((preset) => preset.provider === normalizedProvider)
    || AI_PROVIDER_PRESETS.find((preset) => preset.baseUrl === `${baseUrl || ''}`.trim() && preset.model === `${model || ''}`.trim())
    || AI_PROVIDER_PRESETS[0];
}

function resolveAgentMeta(action) {
  const metaMap = {
    feedback_from_lesson: {
      input: '学生姓名 / 年级 / 课堂主题',
      output: '家校反馈草稿',
      channel: '智能体服务通道'
    },
    exercise_generate: {
      input: '学生姓名 / 年级 / 难度 / 主题',
      output: '练习题 / 错题变式',
      channel: '智能体服务通道'
    },
    renewal_risk_scan: {
      input: '机构ID / 课时 / 续费 / 情绪信号',
      output: '风险等级 / 续费建议',
      channel: '智能体服务通道'
    }
  };

  return metaMap[action] || {
    input: '按当前页面上下文自动补全',
    output: '智能体结果',
    channel: '智能体服务通道'
  };
}

function resolveAgentResultType(outputSnapshot = {}) {
  if (Array.isArray(outputSnapshot?.tasks)) {
    return '练习任务';
  }
  if (Array.isArray(outputSnapshot?.factors) || Array.isArray(outputSnapshot?.recommendations)) {
    return '风控结果';
  }
  if (Array.isArray(outputSnapshot?.suggestions) || outputSnapshot?.tone) {
    return '反馈结果';
  }
  if (outputSnapshot?.mission) {
    return '任务生成';
  }
  return '智能体结果';
}

function csvCell(value) {
  const text = `${value ?? ''}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function slugifyText(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function AgentCenter({
  aiAgents = [],
  onRunAIAgent,
  activeRole = '',
  sourcePage = '',
  sourcePageLabel = '',
  aiSourceLabel = APP_COPY.simulatedText,
  aiProvider = 'mock',
  aiBaseUrl = '',
  aiModel = 'mock'
}) {
  const [runningAgentName, setRunningAgentName] = useState('');
  const [agentTips, setAgentTips] = useState({});
  const [agentRunHistory, setAgentRunHistory] = useState([]);
  const [exportScope, setExportScope] = useState('recent');
  const [runFilter, setRunFilter] = useState('all');
  const [summaryNotice, setSummaryNotice] = useState('');
  const [selectedAgentName, setSelectedAgentName] = useState(aiAgents[0]?.name || '');
  const [selectedRunId, setSelectedRunId] = useState('');
  const currentPreset = normalizeProviderPreset(aiProvider, aiBaseUrl, aiModel);
  const [selectedPresetKey, setSelectedPresetKey] = useState(currentPreset.key);
  useEffect(() => {
    setSelectedPresetKey(currentPreset.key);
  }, [currentPreset.key]);
  const selectedPreset = AI_PROVIDER_PRESETS.find((preset) => preset.key === selectedPresetKey) || currentPreset;
  const templateProvider = selectedPreset.provider;
  const templateBaseUrl = selectedPreset.baseUrl;
  const templateModel = selectedPreset.model;
  const envTemplate = [
    'AI_MODE=provider',
    `AI_PROVIDER=${templateProvider}`,
    `AI_BASE_URL=${templateBaseUrl}`,
    `AI_MODEL=${templateModel}`,
    'AI_API_KEY=请通过 wrangler secret put AI_API_KEY 注入，不要明文写入仓库'
  ].join('\n');

  const downloadTextFile = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1200);
  };

  const exportRunHistory = () => {
    const exportRows = exportRunHistoryScope;
    const rows = [
      agentRunExportColumns.map((column) => column.label)
    ];

    exportRows.forEach((item) => {
      const record = buildAgentRunExportRecord(item);
      rows.push(agentRunExportColumns.map((column) => record[column.key] ?? ''));
    });

    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const sourceSlug = slugifyText(sourcePageLabel || sourcePage || 'agent-center');
    const fileName = `starmate-agent-runs-${sourceSlug}-${exportScope === 'all' ? 'all' : 'recent'}-${runFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadTextFile(fileName, `\ufeff${csv}`, 'text/csv;charset=utf-8');
  };

  const exportRunHistoryJson = () => {
    const exportRows = exportRunHistoryScope;
    const columns = agentRunExportColumns;
    const normalizedRecords = exportRows.map((item) => buildAgentRunExportRecord(item));
    const sourceSlug = slugifyText(sourcePageLabel || sourcePage || 'agent-center');
    const exportFileName = `starmate-agent-runs-${sourceSlug}-${exportScope === 'all' ? 'all' : 'recent'}-${runFilter}-${new Date().toISOString().slice(0, 10)}.json`;
    const summaryFileName = `starmate-agent-summary-${sourceSlug}-${new Date().toISOString().slice(0, 10)}.txt`;
    const statusCounts = exportRows.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    const resultTypeCounts = exportRows.reduce((acc, item) => {
      const type = resolveAgentResultType(item.outputSnapshot || {});
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const payload = {
      meta: {
        schemaVersion: 'starmate.agent-runs.v1',
        generatedAt: new Date().toISOString(),
        scope: exportScope === 'all' ? 'all' : 'recent',
        filter: runFilter,
        filterLabel: {
          all: '全部',
          success: '成功',
          failed: '失败',
          risk: '风控',
          practice: '练习',
          feedback: '反馈'
        }[runFilter] || '全部',
        role: activeRole || '',
        roleLabel: getRoleLabel(activeRole || 'student'),
        sourcePage: sourcePage || '',
        sourcePageLabel: sourcePageLabel || '',
        aiProvider: aiProvider || '',
        aiModel: aiModel || '',
        runtimeContext: runtimeContextLabel,
        sourceSlug,
        exportFileName,
        summaryFileName,
        exportFormat: 'json',
        exportedCount: exportRows.length,
        totalCount: agentRunHistory.length,
        product: 'Aggie速记英语',
        statusCounts,
        resultTypeCounts
      },
      exportSummary: {
        recordCount: exportRows.length,
        role: activeRole || '',
        roleLabel: getRoleLabel(activeRole || 'student'),
        sourcePage: sourcePage || '',
        sourcePageLabel: sourcePageLabel || '',
        aiProvider: aiProvider || '',
        aiModel: aiModel || '',
        runtimeContext: runtimeContextLabel,
        sourceSlug,
        exportFileName,
        summaryFileName,
        exportFormat: 'json',
        filter: runFilter,
        filterLabel: {
          all: '全部',
          success: '成功',
          failed: '失败',
          risk: '风控',
          practice: '练习',
          feedback: '反馈'
        }[runFilter] || '全部'
      },
      auditSchema: {
        version: 'v1',
        recordType: 'agent_run_history',
        exportFormat: 'json',
        fieldOrder: agentRunExportColumns.map((column) => column.key),
        fieldLabels: agentRunExportColumns.reduce((acc, column) => {
          acc[column.key] = column.label;
          return acc;
        }, {}),
        contextKeys: ['role', 'roleLabel', 'sourcePage', 'sourcePageLabel', 'aiProvider', 'aiModel', 'runtimeContext', 'sourceSlug', 'exportFileName', 'summaryFileName']
      },
      columns,
      summary: {
        total: exportRows.length,
        success: statusCounts.success || 0,
        failed: statusCounts.failed || 0,
        riskCount: exportRows.reduce((count, item) => count + (Array.isArray(item.outputSnapshot?.risks) ? item.outputSnapshot.risks.length : 0), 0),
        averageScore: exportRows.length > 0
          ? exportRows.reduce((sum, item) => {
            const value = Number(item.outputSnapshot?.score);
            return Number.isNaN(value) ? sum : sum + value;
          }, 0) / Math.max(
            exportRows.filter((item) => item.outputSnapshot?.score !== undefined && item.outputSnapshot?.score !== null && item.outputSnapshot?.score !== '').length,
            1
          )
          : null,
        latestAgent: exportRows[0]?.agentName || '',
        latestStatus: exportRows[0]?.status || '',
        latestResultType: resolveAgentResultType(exportRows[0]?.outputSnapshot || {}),
        latestAt: exportRows[0]?.createdAt || ''
      },
      normalizedRecords,
      records: exportRows
    };
    downloadTextFile(exportFileName, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  };

  const buildRunSummaryText = () => {
    const scopeLabel = exportScope === 'all' ? '全量记录' : '最近 10 条';
    const filterLabel = {
      all: '全部',
      success: '成功',
      failed: '失败',
      risk: '风控',
      practice: '练习',
      feedback: '反馈'
    }[runFilter] || '全部';
    const oneLineConclusion = summaryStats.total === 0
      ? '无'
      : summaryStats.failed > 0
        ? '故'
        : summaryStats.riskCount > 0
          ? '险'
          : '可';
    const sourceSlug = slugifyText(sourcePageLabel || sourcePage || 'agent-center');
    const summaryFileName = `starmate-agent-runs-${sourceSlug}-${exportScope === 'all' ? 'all' : 'recent'}-${runFilter}-${new Date().toISOString().slice(0, 10)}.txt`;
    const summaryLines = [
      `Aggie速记英语智能体中心摘要（${scopeLabel}）`,
      `一句话结论：${oneLineConclusion}`,
      `来源页面：${sourcePageLabel || sourcePage || '智能体中心'}`,
      `运行上下文：${runtimeContextLabel}`,
      `导出文件：${summaryFileName}`,
      `当前筛选：${filterLabel} / 可导出：${exportRunHistoryScope.length} 条`,
      `最近执行：${summaryStats.total} 次`,
      `成功：${summaryStats.success} 次`,
      `失败：${summaryStats.failed} 次`,
      `平均得分：${scoreAverage}`,
      `风险学员：${summaryStats.riskCount} 名`,
      `最活跃智能体：${topAgentName}${topAgentCount ? `（${topAgentCount} 条）` : ''}`
    ];
    if (agentRunHistory.length > 0) {
      const latest = exportRunHistoryScope[0] || agentRunHistory[0];
      const latestSnapshot = latest.outputSnapshot || {};
      const latestParts = [
        `最新结果：${latest.agentName}`,
        latestSnapshot.title ? `标题：${latestSnapshot.title}` : '',
        latestSnapshot.content ? `内容：${latestSnapshot.content}` : '',
        latestSnapshot.mission ? `任务：${latestSnapshot.mission}` : '',
        Array.isArray(latestSnapshot.recommendations) && latestSnapshot.recommendations.length > 0
          ? `建议：${latestSnapshot.recommendations.slice(0, 2).join(' / ')}`
          : '',
        Array.isArray(latestSnapshot.risks) && latestSnapshot.risks.length > 0
          ? `风险：${latestSnapshot.risks.slice(0, 2).map((risk) => `${risk.student} ${risk.risk}`).join(' / ')}`
          : ''
      ].filter(Boolean);
      if (latestParts.length > 0) {
        summaryLines.push('');
        summaryLines.push(...latestParts);
      }
    }
    return summaryLines.join('\n');
  };

  const copyRunSummary = async () => {
    const text = buildRunSummaryText();
    const sourceSlug = slugifyText(sourcePageLabel || sourcePage || 'agent-center');
    const summaryFileName = `starmate-agent-summary-${sourceSlug}-${new Date().toISOString().slice(0, 10)}.txt`;
    try {
      await navigator.clipboard.writeText(text);
      setSummaryNotice('摘要已复制，可直接发给老板或团队。');
    } catch (error) {
      downloadTextFile(summaryFileName, text);
      setSummaryNotice('浏览器不支持直接复制，已改为下载摘要文件。');
    }
  };

  const summarySource = agentRunHistory.slice(0, 10);
  const summaryStats = summarySource.reduce((acc, item) => {
    acc.total += 1;
    if (item.status === 'success') acc.success += 1;
    if (item.status === 'failed') acc.failed += 1;
    acc.byAgent[item.agentName] = (acc.byAgent[item.agentName] || 0) + 1;
    const snapshot = item.outputSnapshot || {};
    if (Array.isArray(snapshot.risks)) acc.riskCount += snapshot.risks.length;
    if (snapshot.score !== undefined && snapshot.score !== null && snapshot.score !== '') {
      const score = Number(snapshot.score);
      if (!Number.isNaN(score)) {
        acc.scoreTotal += score;
        acc.scoreCount += 1;
      }
    }
    return acc;
  }, {
    total: 0,
    success: 0,
    failed: 0,
    riskCount: 0,
    scoreTotal: 0,
    scoreCount: 0,
    byAgent: {}
  });
  const scoreAverage = summaryStats.scoreCount > 0 ? (summaryStats.scoreTotal / summaryStats.scoreCount).toFixed(1) : '--';
  const topAgentEntry = Object.entries(summaryStats.byAgent).sort((a, b) => b[1] - a[1])[0] || [];
  const topAgentName = topAgentEntry[0] || '未分配';
  const topAgentCount = topAgentEntry[1] || 0;
  const bossConclusion = (() => {
    if (summaryStats.total === 0) return '待';
    if (summaryStats.failed > 0) return '故';
    if (summaryStats.riskCount > 0) return '险';
    if (Number(scoreAverage) >= 85) return '稳';
    return '通';
  })();
  const bossConclusionTone = (() => {
    if (summaryStats.total === 0) return 'muted';
    if (summaryStats.failed > 0) return 'danger';
    if (summaryStats.riskCount > 0) return 'warn';
    if (Number(scoreAverage) >= 85) return 'success';
    return 'info';
  })();
  const filteredRunHistory = agentRunHistory.filter((item) => {
    const resultType = resolveAgentResultType(item.outputSnapshot || {});
    if (runFilter === 'all') return true;
    if (runFilter === 'success') return item.status === 'success';
    if (runFilter === 'failed') return item.status === 'failed';
    if (runFilter === 'risk') return resultType === '风控结果';
    if (runFilter === 'practice') return resultType === '练习任务';
    if (runFilter === 'feedback') return resultType === '反馈结果';
    return true;
  });
  const exportRunHistoryScope = exportScope === 'all' ? filteredRunHistory : filteredRunHistory.slice(0, 10);
  const selectedAgent = aiAgents.find((agent) => agent.name === selectedAgentName) || aiAgents[0] || null;
  const selectedRun = agentRunHistory.find((item) => item.id === selectedRunId) || filteredRunHistory[0] || null;
  const selectedAgentAction = selectedAgent ? resolveAgentAction(selectedAgent, activeRole) : '';
  const selectedAgentMeta = selectedAgentAction ? resolveAgentMeta(selectedAgentAction) : null;
  const quickStats = {
    totalAgents: aiAgents.length,
    executableAgents: aiAgents.filter((agent) => resolveAgentAction(agent, activeRole)).length,
    latestStatus: selectedRun?.status || '待确认',
    latestType: resolveAgentResultType(selectedRun?.outputSnapshot || {})
  };

  const triggerAgent = async (agentName, action) => {
    if (!onRunAIAgent || !action) {
      return;
    }

    setSelectedAgentName(agentName);
    setRunningAgentName(agentName);
    const meta = resolveAgentMeta(action);
    const startedAt = new Date().toISOString();
    try {
      const payload = resolveAgentPayload(action);
      const response = await onRunAIAgent({
        action,
        payload
      });
      const output = response?.output || response?.data?.output || response?.data || {};
      const successMessage = output?.title || '已生成内容';
      const nextRunId = `${agentName}-${startedAt}`;
      setAgentTips((prev) => ({
        ...prev,
        [agentName]: `执行完成：${successMessage}`
      }));
      setAgentRunHistory((prev) => [
          {
            id: nextRunId,
            agentName,
            action,
            status: 'success',
            message: successMessage,
            input: meta.input,
            output: meta.output,
          channel: meta.channel,
            outputSnapshot: output,
            createdAt: startedAt
          },
        ...prev
      ].slice(0, 8));
      setSelectedRunId(nextRunId);
    } catch (error) {
      const failedMessage = error?.message || '请重试';
      const nextRunId = `${agentName}-${startedAt}`;
      setAgentTips((prev) => ({
        ...prev,
        [agentName]: `执行失败：${failedMessage}`
      }));
      setAgentRunHistory((prev) => [
          {
            id: nextRunId,
            agentName,
            action,
            status: 'failed',
            message: failedMessage,
            input: meta.input,
            output: meta.output,
          channel: meta.channel,
            outputSnapshot: null,
            createdAt: startedAt
          },
        ...prev
      ].slice(0, 8));
      setSelectedRunId(nextRunId);
    } finally {
      setRunningAgentName('');
    }
  };

  return (
    <section className="role-grid">
      <div className="panel wide ai-config-card">
        <PanelTitle
          icon={Sparkles}
          title="模型接入"
          action={
            <button
              className="ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(envTemplate);
                } catch {
                  window.prompt('复制下面这段配置到 .env 或 Pages 环境变量', envTemplate);
                }
              }}
            >
              复制变量
            </button>
          }
        />
        <div className="ai-provider-pills">
          {AI_PROVIDER_PRESETS.map((preset) => (
            <button
              key={preset.key}
              className={selectedPresetKey === preset.key ? 'pill-select active' : 'pill-select'}
              onClick={() => setSelectedPresetKey(preset.key)}
              type="button"
            >
              <strong>{preset.label}</strong>
              <small>{preset.note}</small>
            </button>
          ))}
        </div>
        <div className="ai-config-summary">
          <div className="metric">
            <span>接入模式</span>
            <strong>{aiSourceLabel || APP_COPY.simulatedText}</strong>
            <small>{selectedPreset.key === 'custom' ? '当前仅支持本地配置' : '已启用云端模型配置'}</small>
          </div>
          <div className="metric">
            <span>提供方</span>
            <strong>{templateProvider}</strong>
            <small>{selectedPreset.key === 'custom' ? '请切换为 provider 预设' : '兼容 OpenAI 接口格式'}</small>
          </div>
          <div className="metric">
            <span>模型</span>
            <strong>{templateModel}</strong>
            <small>{templateBaseUrl}</small>
          </div>
        </div>
        <div className="ai-config-hint">
          <small>说明：这里只展示接入方式，不改变学习闭环和任务流转。</small>
          <small>如需切换云端模型，只更新供应方、地址、模型名和密钥即可。</small>
        </div>
        <details className="agent-config-details">
          <summary>查看接入变量</summary>
          <pre className="ai-config-template" aria-label="智能体配置模板">{envTemplate}</pre>
        </details>
      </div>

      <section className="panel wide agent-workbench-panel">
        <div className="agent-workbench-header">
          <div>
            <span>任务中枢</span>
            <h3>学习反馈、练习出题、续费风险统一处理</h3>
            <small>三类能力统一在同一工作台里执行，结果可直接进入历史记录。</small>
          </div>
          <div className="agent-workbench-stats">
            <span>可执行 {quickStats.executableAgents} 个</span>
            <span>总能力 {quickStats.totalAgents} 个</span>
            <span>最新 {quickStats.latestType}</span>
            <span>状态 {quickStats.latestStatus}</span>
          </div>
        </div>
        <div className="agent-workbench-grid">
          <article className="agent-workbench-card">
            <strong>当前聚焦</strong>
            <p>{selectedAgent ? selectedAgent.name : '请选择一个智能体能力'}</p>
            <small>{selectedAgent ? selectedAgent.for : '从右侧能力卡选择一个入口'}</small>
            <small>{selectedAgentAction ? `输出：${selectedAgentMeta?.output}` : '请选择智能体能力后执行'}</small>
          </article>
          <article className="agent-workbench-card">
            <strong>适用场景</strong>
            <p>{selectedAgent ? selectedAgent.desc : '适用于课堂反馈、练习生成、续费风险三类主要任务。'}</p>
            <small>{selectedAgentMeta ? `输入：${selectedAgentMeta.input}` : UI_COPY.empty.noExecutionAutoSave}</small>
            <small>{selectedAgentMeta ? `通道：${selectedAgentMeta.channel}` : '未选择能力时仅查看说明'}</small>
          </article>
          <article className="agent-workbench-card">
            <strong>最近结果</strong>
            <p>{selectedRun ? `${selectedRun.agentName} · ${selectedRun.message}` : UI_COPY.empty.noExecution}</p>
            <small>{selectedRun ? `动作：${selectedRun.action}` : UI_COPY.empty.noExecutionDetail}</small>
            <small>{selectedRun ? `时间：${selectedRun.createdAt}` : '支持复制摘要、导出 CSV / JSON。'}</small>
          </article>
        </div>
      </section>

      <section className="agent-grid">
      {aiAgents.map((agent) => {
        const action = resolveAgentAction(agent, activeRole);
        const meta = action ? resolveAgentMeta(action) : null;

        return (
        <article className="agent-card" key={agent.name}>
          <div className="agent-icon"><agent.icon size={20} /></div>
          <strong>{agent.name}</strong>
          <span>{agent.for}</span>
          <div className="agent-status-row">
            {action ? <span className="pill tiny success">已启用</span> : <span className="pill tiny muted">未启用</span>}
            <span className="pill tiny muted">{action || '待授权'}</span>
          </div>
          <p>{agent.desc}</p>
          {action ? (
            <div className="agent-meta-line">
              <small>输入：{meta.input}</small>
              <small>输出：{meta.output}</small>
              <small>通道：{meta.channel}</small>
            </div>
          ) : null}
          {action ? (
            <button
              className="row-action"
              onClick={() => triggerAgent(agent.name, action)}
              disabled={runningAgentName && runningAgentName !== agent.name}
            >
              {runningAgentName === agent.name ? '执行中...' : `执行 ${agent.name}`}
            </button>
          ) : null}
          <button
            className={`row-action ghost ${selectedAgentName === agent.name ? 'active' : ''}`}
            onClick={() => setSelectedAgentName(agent.name)}
          >
            查看任务说明
          </button>
          {agentTips[agent.name] ? <div className="small-note">{agentTips[agent.name]}</div> : null}
          <div className="small-note">输出摘要：{agent.mode}</div>
          {action ? null : (
            <div className="small-note">当前角色未授权该操作</div>
          )}
        </article>
        );
      })}
      </section>
      <div className="panel wide agent-run-panel">
        <PanelTitle
          icon={Play}
          title="任务日志"
          action={agentRunHistory.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <div className="scope-switch">
                <button
                  className={`ghost ${exportScope === 'recent' ? 'active' : ''}`}
                  onClick={() => setExportScope('recent')}
                >
                  最近 10 条
                </button>
                <button
                  className={`ghost ${exportScope === 'all' ? 'active' : ''}`}
                  onClick={() => setExportScope('all')}
                >
                  全量
                </button>
              </div>
              <button className="ghost" onClick={exportRunHistory}>
                导出 CSV
              </button>
              <button className="ghost" onClick={exportRunHistoryJson}>
                导出 JSON
              </button>
              <button className="ghost" onClick={copyRunSummary}>
                复制摘要
              </button>
            </div>
          ) : null}
        />
        {agentRunHistory.length > 0 ? (
          <div className="small-note" style={{ marginBottom: 12 }}>
            当前导出范围：{exportScope === 'all' ? '全量记录' : '最近 10 条'} · 当前筛选：{{ all: '全部', success: '成功', failed: '失败', risk: '风控', practice: '练习', feedback: '反馈' }[runFilter] || '全部'} · 可导出：{exportRunHistoryScope.length} 条
          </div>
        ) : null}
        {agentRunHistory.length > 0 ? (
          <div className="small-note" style={{ marginBottom: 12 }}>
            导出标准：starmate.agent-runs.v1 · 固定字段：{agentRunExportColumns.length} 项 · CSV / JSON / 摘要同口径
          </div>
        ) : null}
        {agentRunHistory.length > 0 ? (
          <div className="scope-switch" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <button className={`ghost ${runFilter === 'all' ? 'active' : ''}`} onClick={() => setRunFilter('all')}>全部</button>
            <button className={`ghost ${runFilter === 'success' ? 'active' : ''}`} onClick={() => setRunFilter('success')}>成功</button>
            <button className={`ghost ${runFilter === 'failed' ? 'active' : ''}`} onClick={() => setRunFilter('failed')}>失败</button>
            <button className={`ghost ${runFilter === 'risk' ? 'active' : ''}`} onClick={() => setRunFilter('risk')}>风控</button>
            <button className={`ghost ${runFilter === 'practice' ? 'active' : ''}`} onClick={() => setRunFilter('practice')}>练习</button>
            <button className={`ghost ${runFilter === 'feedback' ? 'active' : ''}`} onClick={() => setRunFilter('feedback')}>反馈</button>
          </div>
        ) : null}
        {summaryNotice ? (
          <div className="small-note" style={{ marginBottom: 12 }}>
            {summaryNotice}
          </div>
        ) : null}
        {agentRunHistory.length > 0 ? (
          <div className="summary-banner agent-summary-banner" style={{ marginBottom: 12 }}>
            <strong>今日结论 · 一句话版</strong>
            <span
              className={`summary-state-dot ${bossConclusionTone}`}
              aria-label={bossConclusion}
              title={bossConclusion}
            />
          </div>
        ) : null}
        {agentRunHistory.length > 0 ? (
          <div className="summary-grid agent-summary-grid" style={{ marginBottom: 14 }}>
            <article className="summary-card agent-summary-card">
            <strong>最近执行概览</strong>
            <span>{summaryStats.total} 次</span>
            <small>成功 {summaryStats.success} / 失败 {summaryStats.failed}</small>
          </article>
          <article className="summary-card agent-summary-card">
            <strong>平均得分</strong>
              <span>{scoreAverage}</span>
              <small>基于有分数的记录</small>
            </article>
            <article className="summary-card agent-summary-card">
              <strong>风险学员</strong>
              <span>{summaryStats.riskCount} 名</span>
              <small>来自最近 10 条结果</small>
            </article>
            <article className="summary-card agent-summary-card">
              <strong>最活跃智能体</strong>
              <span>{topAgentName}</span>
              <small>{topAgentCount} 条记录</small>
            </article>
          </div>
        ) : null}
        {filteredRunHistory.length === 0 ? (
          <div className="small-note">{UI_COPY.empty.noExecutionReady}</div>
        ) : (
          <div className="agent-run-list">
            {filteredRunHistory.map((item) => (
              <div
                className={`agent-run-item ${selectedRunId === item.id ? 'selected' : ''}`}
                key={item.id}
                onClick={() => setSelectedRunId(item.id)}
              >
                <div>
                  <strong>{item.agentName}</strong>
                  <small>{item.input}</small>
                  <small>{item.output}</small>
                </div>
                <div>
                  <span className={`pill tiny ${item.status === 'success' ? 'success' : 'danger'}`}>
                    {item.status === 'success' ? '执行成功' : '执行失败'}
                  </span>
                  <span className="pill tiny muted" style={{ marginTop: 6 }}>
                    {resolveAgentResultType(item.outputSnapshot || {})}
                  </span>
                  <span className="pill tiny muted" style={{ marginTop: 6 }}>
                    {item.action}
                  </span>
                </div>
                <div className="small-note">
                  <strong>{item.message}</strong>
                  <small>{item.channel}</small>
                  <small>{item.createdAt}</small>
                  {item.outputSnapshot?.content ? <small>内容：{item.outputSnapshot.content}</small> : null}
                  {Array.isArray(item.outputSnapshot?.tasks) ? (
                    <small>任务：{item.outputSnapshot.tasks.slice(0, 3).join(' / ')}</small>
                  ) : null}
                  {item.outputSnapshot?.mission ? <small>任务说明：{item.outputSnapshot.mission}</small> : null}
                  {Array.isArray(item.outputSnapshot?.recommendations) ? (
                    <small>建议：{item.outputSnapshot.recommendations.slice(0, 3).join(' / ')}</small>
                  ) : null}
                  {Array.isArray(item.outputSnapshot?.factors) ? (
                    <small>因素：{item.outputSnapshot.factors.map((factor) => `${factor.key}:${factor.value}`).slice(0, 3).join(' / ')}</small>
                  ) : null}
                  {Array.isArray(item.outputSnapshot?.suggestions) ? (
                    <small>建议点：{item.outputSnapshot.suggestions.slice(0, 3).join(' / ')}</small>
                  ) : null}
                  {item.outputSnapshot?.tone ? <small>语气：{item.outputSnapshot.tone}</small> : null}
                  {item.outputSnapshot?.level ? <small>等级：{item.outputSnapshot.level}</small> : null}
                  {item.outputSnapshot?.score !== undefined ? <small>得分：{item.outputSnapshot.score}</small> : null}
                  {item.outputSnapshot?.reward ? <small>奖励：{item.outputSnapshot.reward}</small> : null}
                  {item.outputSnapshot?.difficulty ? <small>难度：{item.outputSnapshot.difficulty}</small> : null}
                  {item.outputSnapshot?.risks ? <small>风险学员：{item.outputSnapshot.risks.length} 名</small> : null}
                  {Array.isArray(item.outputSnapshot?.risks) ? (
                    <small>风险摘要：{item.outputSnapshot.risks.slice(0, 3).map((risk) => `${risk.student} ${risk.risk}`).join(' / ')}</small>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedRun ? (
          <div className="agent-run-detail">
            <div className="section-headline">
              <div>
                <span>结果详情</span>
                <h3>{selectedRun.agentName}</h3>
              </div>
              <span className={`pill tiny ${selectedRun.status === 'success' ? 'success' : 'danger'}`}>
                {selectedRun.status === 'success' ? '执行成功' : '执行失败'}
              </span>
            </div>
            <div className="agent-run-detail-grid">
              <div className="agent-run-detail-card">
                <strong>动作</strong>
                <p>{selectedRun.action}</p>
              </div>
              <div className="agent-run-detail-card">
                <strong>输出类型</strong>
                <p>{resolveAgentResultType(selectedRun.outputSnapshot || {})}</p>
              </div>
              <div className="agent-run-detail-card">
                <strong>创建时间</strong>
                <p>{selectedRun.createdAt}</p>
              </div>
            </div>
            <pre className="agent-run-detail-pre">{JSON.stringify(selectedRun.outputSnapshot || selectedRun, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HomePage({
  lessons = [],
  child,
  report,
  cultureWall = {},
  admissionsMedia = [],
  activeStageMeta,
  roleLabel,
  currentStage,
  canEditCultureWall = false,
  onUploadCultureAsset,
  onRunAIAgent,
  onNavigatePage,
  publicCourses = [],
  publicCoursesLoading = false,
  publicLeadSubmitting = false,
  publicLeadReplyLoading = false,
  onSubmitPublicLead,
  onSubmitTrialBooking,
  onSendLeadAiReply,
  onSubmitIntervention,
  onRefreshPublicCourses,
  onRefreshStudentCourses,
  onRefreshCultureWall,
  onAction
}) {
  const learningCards = (lessons.length ? lessons : FALLBACK_DATA.teacherLessons).slice(0, 4);
  const admissionsPosterList = Array.isArray(admissionsMedia) ? admissionsMedia.slice(0, 4) : [];
  const safeChild = child || {};
  const childName = safeChild.name || safeChild.studentName || safeChild.nickname || '当前学员';
  const remainingHours = Number(safeChild.hoursLeft || safeChild.hoursLeftCount || safeChild.remainingHours || 0);
  const studentProgress = Number(safeChild.progress || safeChild.doneRate || safeChild.progressRate || 0);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskScan, setRiskScan] = useState(null);
  const [riskFollowupBusy, setRiskFollowupBusy] = useState(false);
  const [riskFollowupMessage, setRiskFollowupMessage] = useState('');
  const [homeActionText, setHomeActionText] = useState('今日建议先完成 1-2 个关键任务，优先推进进度。');
  const [selectedModuleId, setSelectedModuleId] = useState(PRACTICE_MODULES[0]?.id || '');
  const [selectedPublicCourseId, setSelectedPublicCourseId] = useState('');
  const [consultGuardianName, setConsultGuardianName] = useState('');
  const [consultStudentGrade, setConsultStudentGrade] = useState('');
  const [consultNeedSummary, setConsultNeedSummary] = useState('');
  const [consultInitialMessage, setConsultInitialMessage] = useState('');
  const [trialBookingTime, setTrialBookingTime] = useState('');
  const [consultLeadId, setConsultLeadId] = useState('');
  const [consultReplyMessage, setConsultReplyMessage] = useState('');
  const [consultStatusText, setConsultStatusText] = useState('未提交咨询');
  const [consultBusy, setConsultBusy] = useState(false);
  const [selectedReplyLeadId, setSelectedReplyLeadId] = useState('');
  const publicCourseList = Array.isArray(publicCourses) ? publicCourses : [];
  const childProgress = Number(child.progress || report?.progress || report?.doneRate || 0);
  const childMetrics = {
    vocabCount: report?.vocabCount || child?.vocabCount || 1280,
    studyHours: report?.studyHours || child?.studyHours || 36.5,
    checkinDays: report?.checkinDays || child?.checkinDays || Math.max(1, Math.round(childProgress / 2) || 45),
    medals: report?.medals || child?.medals || 28
  };

  const handleQuickStart = () => {
    setHomeActionText('已进入今日学习安排。');
    onAction?.('home', '启动今日学习安排');

    if (onRunAIAgent) {
      Promise.resolve(
        onRunAIAgent({
          action: 'exercise_generate',
          payload: {
            studentName: childName,
            student: childName,
            grade: child.grade || '五年级',
            topic: learningCards[0]?.topic || learningCards[0]?.course || '今日任务'
          }
        })
      ).then((payload) => {
        const output = payload?.data?.output || payload?.output || payload?.data || {};
        const title = `${output.title || '今日学习内容已生成'}`.trim();
        setHomeActionText(title);
      }).catch(() => {});
    }
  };

  const handleJumpCourses = async () => {
    if (onRefreshStudentCourses) {
      setHomeActionText('正在刷新课程数据...');
      try {
        await onRefreshStudentCourses();
        setHomeActionText('课程数据已刷新。');
      } catch (error) {
        setHomeActionText(`课程刷新失败：${error?.message || '请求失败'}`);
      }
    }

    onNavigatePage?.('courses');
    onAction?.('home', '从首页进入课程中心页');
  };

  const handleJumpPractice = async () => {
    if (onNavigatePage) {
      if (onRefreshStudentCourses) {
        setHomeActionText('正在刷新练习与任务数据...');
        try {
          await onRefreshStudentCourses();
          setHomeActionText('练习数据已刷新。');
        } catch (error) {
          setHomeActionText(`练习数据同步失败：${error?.message || '请求失败'}`);
        }
      }
      onNavigatePage('practice');
      onAction?.('home', '从首页进入学习练习');
    }
  };

  const handleViewProfile = () => {
    onNavigatePage?.('profile');
    onAction?.('home', '从首页进入个人中心');
  };

  const handleOpenLesson = (lesson) => {
    if (!lesson) {
      return;
    }
    setHomeActionText(`已聚焦课程：${lesson.topic || lesson.course}。`);
    onNavigatePage?.('courses');
    onAction?.('home', `打开课程：${lesson.topic || lesson.course}`);
  };

  const handleEnterPractice = (module) => {
    if (!module?.id) {
      return;
    }
    setSelectedModuleId(module.id);
    setHomeActionText(`已选择练习模块：${module.title}。`);
    onNavigatePage?.('practice');
    onAction?.('home', `从首页选中练习模块 ${module.title}`);

    if (onRunAIAgent) {
      Promise.resolve(
        onRunAIAgent({
          action: 'exercise_generate',
          payload: {
            studentName: childName,
            student: childName,
            grade: child.grade || '五年级',
            topic: module.title,
            difficulty: module.note || module.level || '中'
          }
        })
      ).catch(() => {});
    }
  };

  const handleOpenCultureWall = async () => {
    if (onRefreshCultureWall) {
      setHomeActionText('正在刷新学习成果馆...');
      try {
        await onRefreshCultureWall();
        setHomeActionText('学习成果馆已更新');
      } catch (error) {
        setHomeActionText(`学习成果馆刷新失败：${error?.message || '请求失败'}`);
      }
    }

    onNavigatePage?.('culture-wall');
    onAction?.('home', '打开学习成果馆');
  };

  const resolveCourseText = (course = {}) => {
    const title = `${course.title || course.course || course.name || '公开课程'}`.trim();
    const grade = `${course.grade || course.targetGrade || '4-12岁'}`.trim();
    const duration = `${course.duration || course.hours || '90分钟/次'}`.trim();
    const fee = `${course.price || course.fee || course.feeLabel || course.monthlyFee || ''}`.trim();
    return { title, grade, duration, fee };
  };
  const selectedPublicCourse = publicCourseList.find((course) => `${course.id}`.trim() === `${selectedPublicCourseId}`);
  const selectedPublicCourseInfo = selectedPublicCourse ? resolveCourseText(selectedPublicCourse) : null;
  const selectedPublicCourseDisplay = selectedPublicCourse ? getCourseDisplay(selectedPublicCourse) : null;
  const selectedPublicCourseRules = selectedPublicCourse ? normalizeCourseRules(selectedPublicCourse) : null;

  const normalizeActionError = (error = {}, fallback = '操作失败') => {
    const raw = `${error?.message || error?.body || '操作失败'}`.trim();
    return raw.includes('api request failed:')
      ? `请求失败：${raw.replace(/^api request failed:\s*/i, '')}`
      : raw.includes('API') || raw.includes('request failed')
        ? raw
        : `${fallback}：${raw || '未知错误'}`;
  };

  const resetConsultForm = () => {
    setConsultNeedSummary('');
    setConsultInitialMessage('');
    setTrialBookingTime('');
  };

  const handleSubmitConsult = async () => {
    if (!onSubmitPublicLead) {
      return;
    }
    if (!selectedPublicCourseId && publicCourseList.length > 0) {
      setConsultStatusText('请先选择课程并重试');
      return;
    }
    setConsultBusy(true);
    setConsultStatusText('咨询提交中...');
    try {
      const payload = await onSubmitPublicLead({
        institutionId: `${(publicCourseList.find((course) => `${course.id}`.trim() === `${selectedPublicCourseId}`)?.institutionId || '')}`.trim(),
        guardianName: consultGuardianName,
        studentGrade: consultStudentGrade,
        needSummary: consultInitialMessage || consultNeedSummary,
        initialMessage: consultInitialMessage,
        courseId: selectedPublicCourseId
      });
      const leadId = `${payload?.data?.lead?.id || payload?.lead?.id || ''}`.trim();
      if (leadId) {
        setConsultLeadId(leadId);
        setSelectedReplyLeadId(leadId);
      }
      setConsultStatusText(leadId ? `咨询已提交：${leadId}` : '咨询已提交，等待 AI 回执');
      resetConsultForm();
      onAction?.('home', '提交公开咨询线索');
    } catch (error) {
      setConsultStatusText(normalizeActionError(error, '提交咨询失败'));
      onAction?.('home', '提交咨询失败');
    } finally {
      setConsultBusy(false);
    }
  };

  const handleTrialBooking = async () => {
    if (!onSubmitTrialBooking || !selectedPublicCourseId) {
      return;
    }
    if (!consultLeadId) {
      setConsultStatusText('请先补充咨询内容后再提交试听预约');
      return;
    }
    const selectedCourse = publicCourseList.find((course) => `${course.id}`.trim() === `${selectedPublicCourseId}`);
    const trialInstitutionId = `${selectedCourse?.institutionId || ''}`.trim();
    if (!trialInstitutionId) {
      setConsultStatusText('所选课程缺少机构信息，请重新选择课程');
      return;
    }
    setConsultBusy(true);
    try {
      await onSubmitTrialBooking({
        leadId: consultLeadId,
        institutionId: trialInstitutionId,
        courseId: selectedPublicCourseId,
        reservedAt: trialBookingTime || new Date().toISOString(),
        durationMinutes: 60,
        sourceChannel: 'home'
      });
      setConsultStatusText('试听预约已提交');
      onAction?.('home', '提交试听预约');
    } catch (error) {
      setConsultStatusText(normalizeActionError(error, '试听预约提交失败'));
      onAction?.('home', '提交试听预约失败');
    } finally {
      setConsultBusy(false);
    }
  };

  const handleReplyConsult = async () => {
    if (!onSendLeadAiReply) {
      return;
    }
    if (!selectedReplyLeadId) {
      setConsultStatusText('请先提交咨询，生成线索ID后再发送回执');
      return;
    }
    if (!consultReplyMessage.trim()) {
      setConsultStatusText('请先输入回执内容');
      return;
    }
    setConsultBusy(true);
    try {
      await onSendLeadAiReply({
        leadId: selectedReplyLeadId,
        message: consultReplyMessage
      });
      onAction?.('home', `发送 AI 咨询回执：${selectedReplyLeadId}`);
      setConsultStatusText('AI 咨询回执已发');
    } catch (error) {
      setConsultStatusText(normalizeActionError(error, '发送回执失败'));
      onAction?.('home', 'AI 咨询回执失败');
    } finally {
      setConsultBusy(false);
    }
  };

  const runRiskScan = async () => {
    if (!onRunAIAgent) {
      return;
    }
    setIsRiskLoading(true);
    setRiskFollowupMessage('');
    try {
      const payload = await onRunAIAgent({
        action: 'renewal_risk_scan',
        payload: {}
      });
      setRiskScan(payload?.output || null);
    } catch (error) {
      setRiskScan({
        title: '续费扫描失败',
        level: '待评估',
        score: 0,
        factors: [
          { key: '错误', value: error instanceof Error ? error.message : '请稍后重试' }
        ],
        recommendations: ['请在后台核验续费状态并补充催缴动作']
      });
      onAction?.('home', `续费扫描失败：${error instanceof Error ? error.message : '扫描失败'}`);
    } finally {
      setIsRiskLoading(false);
    }
  };

  const riskFollowupItems = Array.isArray(riskScan?.risks)
    ? riskScan.risks.filter((item) => Number(item?.risk || 0) >= 70)
    : [];

  const createRiskFollowups = async () => {
    if (!onSubmitIntervention || riskFollowupItems.length === 0) {
      return;
    }

    setRiskFollowupBusy(true);
    setRiskFollowupMessage('');
    const completedStudents = [];

    try {
      for (const item of riskFollowupItems) {
        const studentId = `${item?.studentId || ''}`.trim();
        if (!studentId) {
          continue;
        }
        const studentName = `${item?.student || '学员'}`.trim();
        const riskScore = Number(item?.risk || 0);
        await onSubmitIntervention(studentId, {
          interventionType: 'follow',
          action: `续费跟进：${studentName}`,
          note: `${riskScan?.title || '续费风险巡检'} · 风险 ${riskScore} 分 · ${item?.action || '优先沟通'}`,
          priority: 'high',
          channel: 'founder'
        });
        completedStudents.push(studentName);
      }
      if (completedStudents.length > 0) {
        const joined = completedStudents.join(' / ');
        setRiskFollowupMessage(`已生成 ${completedStudents.length} 条跟进任务`);
        setHomeActionText(`已生成风险跟进：${joined}`);
        onAction?.('home', `生成续费跟进任务：${joined}`);
      } else {
        setRiskFollowupMessage('未找到可提交的高风险学员');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '跟进任务生成失败';
      setRiskFollowupMessage(message);
      setHomeActionText(`跟进任务生成失败：${message}`);
      onAction?.('home', `生成风险跟进失败：${message}`);
    } finally {
      setRiskFollowupBusy(false);
    }
  };

  return (
    <div className="product-page">
      <section className="hero-panel learning-product-hero">
        <div className="hero-main-board">
          <div className="home-brand-line">
            <span className="brand-logo-mark" aria-hidden="true">★</span>
            <div className="brand-line-copy">
              <span>Aggie速记英语</span>
              <small>面向 4-16 岁儿童的英语学习系统</small>
            </div>
          </div>
          <div className="hero-storyboard">
            <div className="hero-story-copy">
              <h1>{activeStageMeta.heroTitle}</h1>
              <p>{activeStageMeta.heroDesc}</p>
              <div className="hero-actions">
                <button className="hero-inline-action" onClick={handleQuickStart}>开始今日任务</button>
              </div>
              <p className="small-note hero-action-note">{homeActionText}</p>
              <div className="hero-chip-row">
                <span className="small-note">当前学员：{childName}</span>
                <span className="small-note">体验身份：{roleLabel}</span>
                <span className="small-note">剩余课时：{remainingHours}节</span>
              </div>
              <div className="hero-score-board">
                <div className="hero-score-head">
                  <strong>Lv.{Math.max(1, Math.round(childProgress / 10) || 1)} {currentStage.label}</strong>
                  <small>{Math.min(1200, Math.round(childProgress * 12))} / 1200 经验值</small>
                </div>
                <div className="learning-progress-bar hero-score-progress">
                  <span style={{ width: `${Math.min(100, Math.max(childProgress, 12))}%` }} />
                </div>
                <div className="hero-stat-board">
                  <div className="hero-stat-card">
                    <span>词汇量</span>
                    <strong>{childMetrics.vocabCount}</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>学习时长</span>
                    <strong>{childMetrics.studyHours}小时</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>累计打卡</span>
                    <strong>{childMetrics.checkinDays}天</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>勋章总数</span>
                    <strong>{childMetrics.medals}枚</strong>
                  </div>
                </div>
              </div>
              <div className="home-quick-launch">
                <button className="home-quick-card" onClick={handleJumpCourses}>
                  <strong>在读课程</strong>
                  <small>先看今天学什么</small>
                </button>
                <button className="home-quick-card" onClick={handleJumpPractice}>
                  <strong>学习练习</strong>
                  <small>开始今日任务</small>
                </button>
              </div>
            </div>
            <div className="hero-mascot-board">
              <div className="hero-mascot-caption">今日学习路线</div>
              <div className="hero-focus-card">
                <span>今日重点</span>
                <strong>{studentName || '当前学员'}</strong>
                <small>剩余课时 {remainingHours} 节 · 当前进度 {Math.max(1, Math.round(studentProgress || 1))}%</small>
              </div>
              <div className="hero-signpost-stack">
                <span>听得懂</span>
                <span>记得住</span>
                <span>说得出</span>
                <span>用得好</span>
              </div>
              <AggieMascotArt />
              <div className="mascot-badge">学习进度可视化</div>
            </div>
          </div>
        </div>
            <div className="hero-side-stack">
          <div className="hero-mentor-card">
            <div className="hero-mentor-head">
              <div>
                <strong>AI 学习教练</strong>
                <small>口语评分 · 纠音建议</small>
              </div>
              <span className="hero-online-dot">在线服务</span>
            </div>
            <div className="hero-mentor-bubble">
              <p>今日先完成“今日重点”后进入本节语音输出任务。</p>
              <p>评分结果会回写复盘记录，并支持家长端追踪。</p>
            </div>
            <div className="hero-mentor-art-wrap">
              <AggieMascotArt className="compact" />
            </div>
            <button className="hero-mentor-primary" onClick={handleQuickStart}>开启口语评估</button>
            <div className="hero-mentor-actions">
              <span>口语任务</span>
              <span>发音校正</span>
              <span>情景对话</span>
              <span>学习复盘</span>
            </div>
          </div>
            <div className="hero-feedback-card">
              <div className="hero-mentor-head">
                <div>
                  <strong>阶段复盘</strong>
                  <small>本周进度核对</small>
                </div>
                <span className="hero-online-dot">已同步</span>
              </div>
            <div className="hero-mentor-bubble">
              <p>本周重点建议：强化表达结构、提升反应速度与理解应用。</p>
              <p>{report.summary}</p>
            </div>
              <div className="hero-feedback-metrics">
              <span>学习态度 <strong>{report.strength || '稳定'}</strong></span>
              <span>课堂表现 <strong>{report.weakness || '待加强'}</strong></span>
              <span>进步指数 <strong>{Math.max(1, Math.round(childProgress || 92))}%</strong></span>
              </div>
          </div>
          <div className="hero-culture-card">
              <div className="hero-mentor-head">
                <div>
                  <strong>学习成果馆</strong>
                <small>课程素材 · 家校可见</small>
                </div>
                <span className="hero-online-dot">查看详情</span>
              </div>
            <div className="culture-preview-grid">
              <div className="culture-preview-tile">课堂视频</div>
              <div className="culture-preview-tile">学习作品</div>
              <div className="culture-preview-tile">课程提醒</div>
              <div className="culture-preview-tile">家长反馈</div>
            </div>
            <button className="row-action" onClick={handleOpenCultureWall}>
              进入成果馆
            </button>
          </div>
        </div>
      </section>

      <section className="panel home-section">
          <div className="section-headline">
            <div>
              <span>学习路径</span>
              <h3>一键进入今日路径任务</h3>
            </div>
          <button className="row-action" onClick={handleJumpPractice}>
            打开练习工作台
          </button>
        </div>
        <div className="home-path-grid">
          {COURSE_PATH_STEPS.map((step) => {
            const statusLabel = step.status === 'done'
              ? '已完成'
              : step.status === 'active'
                ? '进行中'
                : step.status === 'locked'
                  ? '待解锁'
                  : '未开始';
            return (
              <article className={`home-path-card ${step.status}`} key={step.id}>
                <div className="home-path-head">
                  <span className="home-path-index">{String(COURSE_PATH_STEPS.findIndex((item) => item.id === step.id) + 1).padStart(2, '0')}</span>
                  <span className="home-path-status">{statusLabel}</span>
                </div>
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
                <div className="home-path-footer">
                  <small>{step.reward}</small>
                  <button className="row-action ghost" onClick={handleJumpPractice}>开始任务</button>
                </div>
              </article>
            );
          })}
        </div>

      </section>

      <section className="panel home-section">
        <div className="section-headline">
          <div>
            <span>招生入口</span>
            <h3>公开课程与试听</h3>
          </div>
          <button className="row-action" onClick={onRefreshPublicCourses} disabled={!onRefreshPublicCourses || publicCoursesLoading}>
            {publicCoursesLoading ? UI_COPY.loading.refreshing : UI_COPY.actions.refreshPublicCourses}
          </button>
        </div>
        <section className="panel admissions-panel">
          <div className="section-headline compact">
            <div>
              <span>招生海报</span>
              <h3>可随时更新的前台素材</h3>
            </div>
            <button className="row-action ghost" onClick={handleOpenCultureWall}>
              打开素材中心
            </button>
          </div>
          {admissionsPosterList.length > 0 ? (
            <div className="media-grid photo-grid admissions-poster-grid">
              {admissionsPosterList.map((item) => (
                <article className="media-item admissions-poster-card" key={item.id}>
                  <div className="media-cover photo-cover admissions-poster-cover">
                    <img src={item.src || item.mediaUrl || item.coverUrl || ''} alt={item.title || '招生海报'} />
                  </div>
                  <div className="media-body">
                    <strong>{item.title || '招生海报'}</strong>
                    <small>{item.summary || item.description || item.badge || '招生素材'}</small>
                    <small>{item.category || item.badge || item.placement || 'admissions'}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="small-note">暂无招生海报素材。</div>
          )}
        </section>
        <div className="feature-split home-public-layout">
          <section className="panel home-course-panel">
            <div className="section-headline">
              <div>
                <span>公开课程</span>
                <h3>先看课程内容，再咨询</h3>
              </div>
            </div>
            <div className="home-course-grid">
              {publicCoursesLoading ? <div className="small-note">课程清单刷新中...</div> : null}
              {publicCourseList.length === 0 && !publicCoursesLoading ? <div className="small-note">{UI_COPY.empty.noPublicCourses}</div> : null}
              {publicCourseList.map((course) => {
                const info = resolveCourseText(course);
                const display = getCourseDisplay(course);
                const isSelected = `${course.id}`.trim() === `${selectedPublicCourseId}`;
                return (
                  <article className="learning-card" key={course.id || info.title}>
                    <div className="learning-card-top">
                      <span className="small-note">{info.grade}</span>
                    </div>
                    <strong>{info.title}</strong>
                    <p>{info.fee ? `收费标准：${info.fee}` : '收费标准待设置'}</p>
                    <div className="course-meta-row">
                      <span>班型：{display.classType}</span>
                      <span>时长：{info.duration}</span>
                    </div>
                    <small>可报名名额：{course.capacityLeft || course.capacity || '—'}</small>
                    <button
                      className={isSelected ? 'row-action ghost' : 'row-action'}
                      onClick={() => setSelectedPublicCourseId(`${course.id}`)}
                    >
                      {isSelected ? '已选中试听课程' : '立即预约试听'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel encouragement-panel home-consult-panel">
            <div className="section-headline">
              <div>
                <span>试听咨询</span>
                <h3>AI咨询与试听预约</h3>
              </div>
            </div>
            <div className="encouragement-copy">
              <label>
                <span>家长姓名</span>
                <input value={consultGuardianName} onChange={(event) => setConsultGuardianName(event.target.value)} />
              </label>
              <div className="hero-chip-row" style={{ marginTop: 8 }}>
                <button className="row-action" onClick={handleSubmitConsult} disabled={publicLeadSubmitting || consultBusy}>
                  {publicLeadSubmitting || consultBusy ? '提交中...' : '提交咨询'}
                </button>
              </div>
              <div className="hero-chip-row" style={{ marginTop: 8 }}>
                <span className="small-note">咨询状态：{consultStatusText}</span>
                <span className="small-note">线索ID：{consultLeadId || '—'}</span>
              </div>
              {selectedPublicCourse && selectedPublicCourseInfo ? (
                <div className="alert-list" style={{ marginTop: 10 }}>
                  <div className="alert-row">
                    <span className="status-dot blue" />
                    <div>
                      <strong>{selectedPublicCourseInfo.title}</strong>
                      <small>
                        {selectedPublicCourseInfo.grade} · 班型：{selectedPublicCourseDisplay?.classType || '待设置'} · 时长：{selectedPublicCourseInfo.duration}
                      </small>
                      <small>
                        {selectedPublicCourseInfo.fee ? `收费标准：${selectedPublicCourseInfo.fee}` : '收费标准待设置'} · 课程ID：{selectedPublicCourse.id}
                      </small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="small-note" style={{ marginTop: 10 }}>请先选择试听课程</div>
              )}
              {selectedPublicCourse && selectedPublicCourseRules ? (
                <div className="alert-list" style={{ marginTop: 10 }}>
                  <div className="alert-row">
                    <span className="status-dot green" />
                    <div>
                      <strong>课程详情</strong>
                      <small>上课日期：{selectedPublicCourseRules.scheduleDate}</small>
                      <small>到课规则：{selectedPublicCourseRules.attendanceRule}</small>
                      <small>保留规则：{selectedPublicCourseRules.holdRule}</small>
                    </div>
                    <small className="small-note">
                      {selectedPublicCourseDisplay?.classType || '班型待设置'} · {selectedPublicCourseDisplay?.time || '时间待设置'}
                    </small>
                  </div>
                </div>
              ) : null}
              <label>
                <span>咨询内容</span>
                <textarea value={consultInitialMessage} onChange={(event) => setConsultInitialMessage(event.target.value)} />
              </label>
              <label>
                <span>试听预约时间</span>
                <input type="datetime-local" value={trialBookingTime} onChange={(event) => setTrialBookingTime(event.target.value)} />
              </label>
              <div className="hero-chip-row" style={{ marginTop: 8 }}>
                <button className="row-action" onClick={handleTrialBooking} disabled={!consultLeadId || publicLeadSubmitting || consultBusy}>
                  提交试听预约
                </button>
              </div>
              <div className="section-headline" style={{ marginTop: 14 }}>
                <div>
                  <span>AI 回执</span>
                  <h3>发送咨询回复</h3>
                </div>
              </div>
              <label>
                <span>回执线索ID</span>
                <input
                  value={selectedReplyLeadId}
                  onChange={(event) => setSelectedReplyLeadId(event.target.value)}
                  placeholder="提交咨询后自动填入，也可手动调整"
                />
              </label>
              <label>
                <span>回执内容</span>
                <textarea
                  value={consultReplyMessage}
                  onChange={(event) => setConsultReplyMessage(event.target.value)}
                  placeholder="如：已收到咨询，我们会尽快安排试听..."
                />
              </label>
              <div className="hero-chip-row" style={{ marginTop: 8 }}>
                <button className="row-action" onClick={handleReplyConsult} disabled={publicLeadSubmitting || consultBusy || !onSendLeadAiReply}>
                  发送 AI 回执
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>

      <div className="feature-split">
        <section className="panel practice-zone-panel">
          <div className="section-headline">
            <div>
              <span>学习练习</span>
              <h3>模块化学习</h3>
            </div>
          <button className="row-action" onClick={handleJumpPractice}>
                打开练习工作台
              </button>
            </div>
          <div className="practice-module-grid">
            {PRACTICE_MODULES.map((module) => (
              <article className="practice-module-card" key={module.id}>
                <div className="practice-module-icon">
                  <module.icon size={20} />
                </div>
                <strong>{module.title}</strong>
                <p>{module.desc}</p>
                <small>{module.note}</small>
                <small className="small-note">当前选中：{selectedModuleId === module.id ? '已选中' : '未选中'}</small>
                <button
                  className="row-action"
                  onClick={() => handleEnterPractice(module)}
                >
                  进入训练
                </button>
              </article>
            ))}
          </div>
        </section>

        {onRunAIAgent ? (
        <section className="panel encouragement-panel">
            <div className="section-headline">
              <div>
                <span>运营提醒</span>
                <h3>续费提醒</h3>
              </div>
              <button className="row-action" onClick={runRiskScan} disabled={isRiskLoading}>
                {isRiskLoading ? '扫描中...' : '立即扫描'}
              </button>
            </div>
            <div className="encouragement-copy">
              <p style={{ marginBottom: 8 }}>
                <strong>{riskScan?.title || '点击立即扫描可生成续费提醒建议。'}</strong>
              </p>
              {riskScan ? (
                <>
                  <div className="growth-ring compact">
                    <strong>{riskScan.level || '-'}</strong>
                    <span>风险等级</span>
                    <small>得分 {riskScan.score || 0}</small>
                  </div>
                  <small className="small-note">
                    {(riskScan.factors || []).map((item) => `${item.key}: ${item.value}`).join('；') || '未检测到异常'}
                  </small>
                  {riskFollowupItems.length > 0 ? (
                    <div className="alert-list" style={{ marginTop: 10 }}>
                      {riskFollowupItems.map((item) => (
                        <div className="alert-row" key={`${item.studentId || item.student}-${item.risk}`}>
                          <span className={`status-dot ${item.priority === 'high' ? 'red' : 'yellow'}`} />
                          <div>
                            <strong>{item.student || '学员'}</strong>
                            <small>
                              {item.grade || '未标注年级'} · 课时 {Number(item.hoursLeft || 0)} 节 · 风险 {Number(item.risk || 0)} 分
                            </small>
                            <small>{item.action || '续费跟进'}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
              <ul className="check-list">
                {(riskScan?.recommendations || []).map((item) => (
                  <li key={item}><MessageCircleHeart size={16} />{item}</li>
                ))}
              </ul>
              {riskFollowupMessage ? <small className="small-note">{riskFollowupMessage}</small> : null}
              <div className="hero-chip-row" style={{ marginTop: 8 }}>
                {onSubmitIntervention ? (
                  <button
                    className="row-action"
                    onClick={createRiskFollowups}
                    disabled={isRiskLoading || riskFollowupBusy || riskFollowupItems.length === 0}
                  >
                    {riskFollowupBusy ? '生成中...' : '生成风险跟进'}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="panel encouragement-panel">
          <div className="section-headline">
            <div>
              <span>个人中心</span>
              <h3>今日快照</h3>
            </div>
          </div>
          <div className="encouragement-body">
            <div className="growth-ring compact">
              <strong>{child.progress}%</strong>
              <span>已完成</span>
            </div>
            <div className="encouragement-copy">
              <strong>{child.name} 今天表现不错</strong>
              <p>{report.summary}</p>
              <ul className="check-list">
                <li><Sparkles size={16} /> 进步：{report.strength}</li>
                <li><Star size={16} /> 继续加强：{report.weakness}</li>
                <li><MessageCircleHeart size={16} /> 下一步：{report.nextStep}</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <CultureWallSection
            id="culture-wall"
            data={cultureWall}
            canEdit={canEditCultureWall}
            onUploadAsset={onUploadCultureAsset}
            onAction={onAction}
        />

      <section className="panel home-section">
        <div className="section-headline">
          <div>
            <span>成就记录</span>
            <h3>最近勋章与积分</h3>
          </div>
        </div>
        <div className="achievement-grid">
          {ACHIEVEMENT_ITEMS.map((item) => (
            <article className="achievement-card" key={item.id}>
              <div className="achievement-icon">
                <item.icon size={20} />
              </div>
              <strong>{item.title}</strong>
              <small>{item.note}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CoursesPage({
  lessons = [],
  report,
  activeStageMeta,
  activeRole = '',
  studentCourses = [],
  studentReviewSummary = {},
  studentReviewHistory = [],
  selectedCourseId = '',
  selectedChildId = '',
  onNavigatePage,
  onRunAIAgent,
  onRefreshCourses,
  onAction,
  onSubmitPathCompletion,
  onCreateCourse,
  onUpdateCourse
}) {
  const sourceLessons = activeRole === 'student' && Array.isArray(studentCourses) && studentCourses.length
    ? studentCourses
    : lessons;
  const courseCards = Array.isArray(sourceLessons) && sourceLessons.length > 0
    ? sourceLessons.map((item, index) => ({
      ...getCourseDisplay(item, '未排课'),
      sourceLesson: item,
      id: item.id || item.courseId || item.course_id || `course_${index}`,
      course: item.course || item.name || item.courseName || item.title || '课程项',
      topic: item.topic || item.subject || item.course_type || item.type || '综合英语',
      grade: item.grade || item.gradeAlias || '五年级',
      student: item.student || item.studentName || item.student_name || '当前学员',
      statusText: item.status || item.statusText || '未开始'
    }))
    : FALLBACK_DATA.teacherLessons;
  const [selectedId, setSelectedId] = useState(courseCards[0]?.id);
  const [selectedPathId, setSelectedPathId] = useState('story');
  const [courseDetailMode, setCourseDetailMode] = useState('overview');
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [courseDrawerMode, setCourseDrawerMode] = useState('create');
  const [courseDrawerCourseId, setCourseDrawerCourseId] = useState('');
  const [courseDrawerSubmitting, setCourseDrawerSubmitting] = useState(false);
  const [courseDrawerError, setCourseDrawerError] = useState('');
  const [courseDraft, setCourseDraft] = useState({
    name: '',
    grade: '',
    level: '',
    classType: 'small',
    schedule: '',
    startTime: '',
    durationMinutes: 90,
    capacity: 12,
    priceCents: 0,
    status: 'active',
    teacherId: '',
    imageUrl: ''
  });
  const currentCourse = courseCards.find((item) => item.id === selectedId) || courseCards[0];
  const currentPath = COURSE_PATH_STEPS.find((item) => item.id === selectedPathId) || COURSE_PATH_STEPS[1];
  const reviewSummary = studentReviewSummary?.summary || studentReviewSummary || {};
  const deriveCompletedPathIds = useMemo(() => {
    const collected = [];
    const items = Array.isArray(studentReviewHistory) ? studentReviewHistory : [];
    items.forEach((item) => {
      const taskType = `${item?.taskType || item?.task_type || ''}`.trim();
      const payload = item?.payload || {};
      const source = `${payload.source || item?.source || ''}`.trim();
      if (taskType !== 'path_completion' && source !== 'student_home_path') {
        return;
      }
      const pathId = `${payload.pathId || item.pathId || item.id || ''}`.trim();
      const pathTitle = `${payload.pathTitle || item.title || ''}`.trim();
      const matchedStep = COURSE_PATH_STEPS.find((step) => step.id === pathId || step.title === pathTitle);
      const resolvedId = matchedStep?.id || pathId || '';
      if (resolvedId && !collected.includes(resolvedId)) {
        collected.push(resolvedId);
      }
    });
    if (collected.length === 0) {
      collected.push(COURSE_PATH_STEPS[0]?.id || 'story');
    }
    return collected;
  }, [studentReviewHistory]);
  const courseProgress = Number(reviewSummary.doneRate) > 0
    ? Number(reviewSummary.doneRate)
    : COURSE_SKILL_GOALS.reduce((sum, item) => sum + item.value, 0) / COURSE_SKILL_GOALS.length;
  const currentCourseRules = normalizeCourseRules(currentCourse);
  const [completedPathIds, setCompletedPathIds] = useState(() => deriveCompletedPathIds);
  const [courseHint, setCourseHint] = useState('选择学习模块后点击进入，即可查看下一步学习安排。');
  const [courseActionEnabled, setCourseActionEnabled] = useState(true);
  const [isRefreshingCourses, setIsRefreshingCourses] = useState(false);
  const hasCoursesRefresh = typeof onRefreshCourses === 'function';

  useEffect(() => {
    setCompletedPathIds(deriveCompletedPathIds);
  }, [deriveCompletedPathIds]);

  useEffect(() => {
    const nextSelectedId = `${selectedCourseId || ''}`.trim();
    if (!nextSelectedId) {
      return;
    }
    if (`${selectedId || ''}` === nextSelectedId) {
      return;
    }
    if (courseCards.some((item) => `${item.id}` === nextSelectedId)) {
      setSelectedId(nextSelectedId);
      setCourseHint('已定位到首页选中的课程。');
    }
  }, [selectedCourseId, selectedId, courseCards]);

  const refreshCoursesContext = async (controlId, actionLabel) => {
    if (!onRefreshCourses) {
      const message = `${actionLabel}失败：课程服务暂不可用`;
      setCourseHint(message);
      onAction?.(controlId, message);
      return false;
    }

    try {
      setCourseHint(`${actionLabel}前正在同步课程数据...`);
      await onRefreshCourses();
      onAction?.(controlId, `${actionLabel}课程上下文已更新`);
      return true;
    } catch (error) {
      const message = `${actionLabel}失败：${error instanceof Error ? error.message : '课程数据同步失败'}`;
      setCourseHint(message);
      onAction?.(controlId, message);
      return false;
    }
  };

  const hasUnlockedPath = (pathId) => {
    const targetIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === pathId);
    const lockedIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === COURSE_PATH_STEPS[0]?.id);
    const lastCompletedIndex = Math.max(
      ...completedPathIds.map((id) => COURSE_PATH_STEPS.findIndex((item) => item.id === id)),
      lockedIndex
    );
    return targetIndex <= lastCompletedIndex + 1;
  };

  const getPathStatus = (path) => {
    if (completedPathIds.includes(path.id)) {
      return 'done';
    }
    if (path.id === selectedPathId || hasUnlockedPath(path.id)) {
      return 'active';
    }
    return 'locked';
  };

  const handlePathContinue = async () => {
    const currentStatus = getPathStatus(currentPath);
    if (!courseActionEnabled || currentStatus === 'locked' || !hasUnlockedPath(currentPath.id)) {
      setCourseHint('当前课程待解锁，请先完成前序课程后继续。');
      onAction?.('courses', `课程尝试失败：${currentPath.title} 还未解锁`);
      return;
    }

    if (currentStatus === 'done') {
      const nextIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === currentPath.id) + 1;
      const nextStep = COURSE_PATH_STEPS[nextIndex];
      setCourseHint(`“${currentPath.title}”已完成，建议继续下一步学习。`);
      onAction?.('courses', `复用已完成课程：${currentPath.title}`);
      if (nextStep) {
        setSelectedPathId(nextStep.id);
      }
      return;
    }

    setCourseActionEnabled(false);
    setCourseHint(`已完成「${currentPath.title}」，正在记录学习路径...`);

    try {
      if (onSubmitPathCompletion) {
        await onSubmitPathCompletion({
          pathId: currentPath.id,
          title: currentPath.title,
          pathTitle: currentPath.title,
          stepIndex: COURSE_PATH_STEPS.findIndex((item) => item.id === currentPath.id),
          answer: `已完成「${currentPath.title}」`,
          source: 'courses_page'
        });
      }
      if (onRefreshCourses) {
        await onRefreshCourses();
      }
      setCompletedPathIds((prev) => (prev.includes(currentPath.id) ? prev : [...prev, currentPath.id]));
      setCourseHint(`已完成「${currentPath.title}」，正在生成下一步建议...`);
      onAction?.('courses', `完成课程：${currentPath.title}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '路径提交失败';
      setCourseHint(`路径提交失败：${message}`);
      onAction?.('courses', `路径提交失败：${currentPath.title}${message ? `（${message}）` : ''}`);
      setCourseActionEnabled(true);
      return;
    }

    const resolveNextStep = (nextStep) => {
      if (nextStep) {
        setSelectedPathId(nextStep.id);
        setCourseHint(`已解锁「${nextStep.title}」，可继续下一步学习。`);
        onAction?.('courses', `自动解锁下一步：${nextStep.title}`);
      } else {
        setCourseHint('本周学习路径已完成，任务自动归档。');
        onAction?.('courses', '本周学习路径完成');
      }
      setCourseActionEnabled(true);
    };

    if (onRunAIAgent) {
      Promise.resolve(
        onRunAIAgent({
          action: 'exercise_generate',
          payload: {
            studentName: report?.student?.name || '当前学生',
            student: report?.student?.name || '当前学生',
            grade: report?.student?.grade || '五年级',
            topic: currentPath.title,
            difficulty: currentPath.reward || '中'
          }
        })
      )
        .then(() => {
          const nextIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === currentPath.id) + 1;
          resolveNextStep(COURSE_PATH_STEPS[nextIndex]);
        })
        .catch(() => {
          const nextIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === currentPath.id) + 1;
          resolveNextStep(COURSE_PATH_STEPS[nextIndex]);
        });
      return;
    }

    const nextIndex = COURSE_PATH_STEPS.findIndex((item) => item.id === currentPath.id) + 1;
    resolveNextStep(COURSE_PATH_STEPS[nextIndex]);
  };

  const handleSelectCourseCard = async (lesson) => {
    if (!lesson?.id) {
      onAction?.('courses.library.item', '课程卡片数据异常：缺少课程ID');
      return;
    }

    const refreshed = await refreshCoursesContext(
      'courses.library.item',
      `课程卡片 ${lesson.course || lesson.topic || lesson.id}`
    );
    if (!refreshed) {
      return;
    }

    setSelectedId(lesson.id);
    setCourseHint(`当前课程：${lesson.course || lesson.topic || lesson.id}`);
    onAction?.('courses.library.item', `选中课程：${lesson.course || lesson.topic || lesson.id}`);
    if (activeRole === 'founder') {
      openCourseDrawer(lesson.sourceLesson || lesson);
    }
  };

  const handleSelectPath = async (path) => {
    if (!hasUnlockedPath(path.id)) {
      setCourseHint('请先完成上一节后再进入下一单元。');
      onAction?.('courses', `课程路径未解锁：${path.title}`);
      return;
    }

    const synced = await refreshCoursesContext('courses.path.tab', `课程路径 ${path.title}`);
    if (!synced) {
      return;
    }

    setSelectedPathId(path.id);
    setCourseHint(`当前选中：${path.title}`);
    onAction?.('courses.path.tab', `切换课程路径：${path.title}`);
    if (onRunAIAgent) {
      Promise.resolve(
        onRunAIAgent({
          action: 'exercise_generate',
          payload: {
            studentName: report?.student?.name || '当前学生',
            student: report?.student?.name || '当前学生',
            grade: report?.student?.grade || '五年级',
            topic: path.title,
            difficulty: path.reward || '中'
          }
        })
      ).catch(() => {});
    }
  };

  const handleRefreshCourses = async () => {
    if (!onRefreshCourses) {
      setCourseHint('课程列表以服务端快照展示，当前界面不提供手动刷新');
      onAction?.('courses.overview.refresh', '课程总览刷新失败：接口缺失');
      return;
    }
    setIsRefreshingCourses(true);
    try {
      const refreshed = await refreshCoursesContext('courses.overview.refresh', '课程总览');
      if (refreshed) {
        setCourseHint('课程总览已刷新。');
      } else {
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '课程刷新失败';
      setCourseHint(`课程总览刷新失败：${message}`);
      onAction?.('courses.overview.refresh', `课程总览刷新失败：${message}`);
    } finally {
      setIsRefreshingCourses(false);
    }
  };

  const buildDrawerDraft = (lesson = null) => ({
    name: `${lesson?.sourceLesson?.name || lesson?.sourceLesson?.course || lesson?.course || lesson?.name || lesson?.courseName || lesson?.title || ''}`.trim(),
    grade: `${lesson?.sourceLesson?.grade || lesson?.grade || lesson?.gradeAlias || ''}`.trim(),
    level: `${lesson?.sourceLesson?.level || lesson?.level || ''}`.trim(),
    classType: `${lesson?.sourceLesson?.classType || lesson?.sourceLesson?.class_type || lesson?.classType || lesson?.class_type || 'small'}`.trim() || 'small',
    schedule: `${lesson?.sourceLesson?.schedule || lesson?.schedule || ''}`.trim(),
    startTime: `${lesson?.sourceLesson?.startTime || lesson?.sourceLesson?.start_time || lesson?.startTime || lesson?.start_time || ''}`.trim(),
    durationMinutes: Number(lesson?.sourceLesson?.durationMinutes || lesson?.sourceLesson?.duration_minutes || lesson?.durationMinutes || lesson?.duration_minutes || 90),
    capacity: Number(lesson?.sourceLesson?.capacity || lesson?.capacity || 12),
    priceCents: Number(lesson?.sourceLesson?.priceCents || lesson?.sourceLesson?.price_cents || lesson?.priceCents || lesson?.price_cents || 0),
    status: `${lesson?.sourceLesson?.status || lesson?.status || 'active'}`.trim() || 'active',
    teacherId: `${lesson?.sourceLesson?.teacherId || lesson?.sourceLesson?.teacher_id || lesson?.teacherId || lesson?.teacher_id || ''}`.trim(),
    imageUrl: `${lesson?.sourceLesson?.imageUrl || lesson?.sourceLesson?.image_url || lesson?.imageUrl || lesson?.image_url || ''}`.trim()
  });

  const openCourseDrawer = (lesson = null) => {
    const isEditing = Boolean(lesson?.id);
    setCourseDrawerMode(isEditing ? 'edit' : 'create');
    setCourseDrawerCourseId(isEditing ? `${lesson.id}`.trim() : '');
    setCourseDrawerError('');
    setCourseDrawerOpen(true);
    setCourseDraft(buildDrawerDraft(lesson));
  };

  const closeCourseDrawer = () => {
    setCourseDrawerOpen(false);
    setCourseDrawerError('');
    setCourseDrawerSubmitting(false);
    setCourseDrawerMode('create');
    setCourseDrawerCourseId('');
    setCourseDraft(buildDrawerDraft(null));
  };

  const handleCourseDraftChange = (field, value) => {
    setCourseDraft((current) => ({
      ...current,
      [field]: field === 'durationMinutes' || field === 'capacity' || field === 'priceCents'
        ? Number(value || 0)
        : value
    }));
  };

  const handleSaveCourse = async () => {
    const normalizedName = `${courseDraft.name || ''}`.trim();
    if (!normalizedName) {
      setCourseDrawerError('课程名称不能为空');
      return;
    }
    if (courseDrawerMode === 'edit' && !courseDrawerCourseId) {
      setCourseDrawerError('课程ID缺失，无法保存');
      return;
    }
    const savePayload = {
      ...courseDraft,
      name: normalizedName,
      id: courseDrawerCourseId || undefined,
      courseId: courseDrawerCourseId || undefined
    };

    setCourseDrawerSubmitting(true);
    setCourseDrawerError('');
    try {
      if (courseDrawerMode === 'edit') {
        await onUpdateCourse?.(savePayload);
      } else {
        await onCreateCourse?.(savePayload);
      }
      onAction?.(
        'courses.library.refresh',
        courseDrawerMode === 'edit' ? `更新课程：${normalizedName}` : `创建课程：${normalizedName}`
      );
      closeCourseDrawer();
    } catch (error) {
      setCourseDrawerError(error instanceof Error ? error.message : '课程保存失败');
    } finally {
      setCourseDrawerSubmitting(false);
    }
  };

  const courseDetailModes = [
    { id: 'overview', label: '课程概览' },
    { id: 'pace', label: '学习节奏' },
    { id: 'schedule', label: '课程安排' }
  ];

  const renderCourseDetailBody = () => {
    if (courseDetailMode === 'pace') {
      return (
        <div className="course-detail-stack">
          <div className="detail-bubble">
            <strong>当前节奏</strong>
            <p>{currentCourseRules.attendanceRule}</p>
          </div>
          <div className="detail-bubble">
            <strong>课堂节奏</strong>
            <p>{currentCourseRules.holdRule}</p>
          </div>
          <div className="detail-bubble">
            <strong>阶段建议</strong>
            <p>{report?.nextStep || reviewSummary.nextStep || '先热身，再阅读，再拼句，最后开口表达。'}</p>
          </div>
        </div>
      );
    }

    if (courseDetailMode === 'schedule') {
      return (
        <div className="course-detail-stack">
          <div className="detail-bubble">
            <strong>上课日期</strong>
            <p>{currentCourseRules.scheduleDate}</p>
          </div>
          <div className="detail-bubble">
            <strong>上课时间</strong>
            <p>{currentCourse.time}</p>
          </div>
          <div className="detail-bubble">
            <strong>班型</strong>
            <p>{currentCourse.classType}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="course-detail-stack">
        <div className="detail-bubble">
          <strong>本节主线</strong>
          <p>{currentCourse.topic}</p>
        </div>
        <div className="detail-bubble">
          <strong>当前课程</strong>
          <p>{currentCourse.course}</p>
        </div>
        <div className="detail-bubble">
          <strong>学习建议</strong>
          <p>{report?.nextStep || reviewSummary.nextStep || '先完成今日口语任务后，再继续下一站。'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="product-page">
      <section className="panel page-banner course-world-banner">
        <div>
          <span>课程总览</span>
          <h3>{activeStageMeta.label} 课程执行看板</h3>
          <p>课程表、课时扣减、收费标准与作业进度已按课程一体聚合，支持按班型与日期快速核对。</p>
          <div className="hero-chip-row">
            <span className="small-note">课程进度已更新</span>
            <span className="small-note">复盘记录可追溯</span>
            <span className="small-note">剩余课时即时可见</span>
            {selectedChildId ? <span className="small-note">当前孩子：{selectedChildId}</span> : null}
          </div>
        </div>
        <div className="course-summary-token">
          <strong>{Math.round(courseProgress)}%</strong>
          <small>本周教学进度</small>
        </div>
      </section>

      <section className="panel home-section course-overview-panel">
        <div className="section-headline">
          <div>
            <span>课程总览</span>
            <h3>课程与课时核对看板</h3>
          </div>
          {hasCoursesRefresh ? (
            <button
              className="row-action"
              onClick={handleRefreshCourses}
              disabled={isRefreshingCourses}
            >
              {isRefreshingCourses ? '刷新中...' : '刷新总览'}
            </button>
          ) : (
            <span className="small-note">课程数据来自服务端快照</span>
          )}
        </div>
        <div className="metrics course-overview-metrics">
          <MetricCard icon={BookOpenCheck} label="课程总数" value={`${courseCards.length}门`} note="当前可查看课程条目" tone="green" />
          <MetricCard icon={Rocket} label="路径进度" value={`${Math.round(courseProgress)}%`} note={`已解锁 ${completedPathIds.length}/${COURSE_PATH_STEPS.length} 站`} tone="blue" />
          <MetricCard icon={CalendarDays} label="当前课程" value={currentCourse.course || '未排课'} note={`${currentCourse.grade} · ${currentCourse.classType || '班型待录入'}`} tone="yellow" />
          <MetricCard
            icon={ShieldCheck}
            label="课时规则"
            value="按机构策略"
            note={`${currentCourseRules.attendanceRule || '到课规则'} · ${currentCourseRules.holdRule || '课时保留规则'}`}
            tone="purple"
          />
        </div>
      </section>

      <div className="feature-split">
        <section className="panel course-map-panel">
          <div className="section-headline">
            <div>
              <span>学习路径</span>
              <h3>本阶段教学路径</h3>
            </div>
          </div>
          <div className="course-path-lane">
            {COURSE_PATH_STEPS.map((step, index) => (
              <button
                className={`path-step ${getPathStatus(step)} ${selectedPathId === step.id ? 'selected' : ''}`}
                key={step.id}
                onClick={() => handleSelectPath(step)}
              >
                <span className="path-step-index">
                  {getPathStatus(step) === 'locked' ? <Lock size={18} /> : index + 1}
                </span>
                <strong>{step.title}</strong>
                <small>{step.desc}</small>
                <em>{step.reward}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="panel course-detail-panel">
          <div className="section-headline">
            <div>
              <span>当前课程安排</span>
              <h3>{currentPath.title}</h3>
            </div>
            <button
              className="row-action"
              onClick={handlePathContinue}
              disabled={getPathStatus(currentPath) === 'locked' || (!courseActionEnabled && getPathStatus(currentPath) !== 'done')}
            >
              {getPathStatus(currentPath) === 'locked'
                ? '待开启'
                : getPathStatus(currentPath) === 'done'
                  ? '已完成'
                : courseActionEnabled
                  ? '进入下一步'
                  : '处理中'}
          </button>
        </div>
          <div className="course-detail-tabs">
            {courseDetailModes.map((mode) => (
              <button
                key={mode.id}
                className={courseDetailMode === mode.id ? 'active' : ''}
                onClick={() => setCourseDetailMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="course-focus-card">
            <div className="practice-module-icon"><BookOpenCheck size={20} /></div>
            <strong>{currentCourse.course}</strong>
            <p>{currentCourse.topic}</p>
            <small>{currentCourse.student} · {currentCourse.grade} · {currentCourse.classType} · {currentCourse.fee}</small>
            <small className="small-note">{normalizeCourseTime(currentCourse)}</small>
            <small className="small-note">进度提示：{courseHint}</small>
          </div>
          {renderCourseDetailBody()}
        </section>
      </div>

      <section className="panel course-library-panel">
          <div className="section-headline">
            <div>
              <span>在读课程</span>
              <h3>课程表明细（班型/时间/收费标准）</h3>
            </div>
            <div className="hero-chip-row" style={{ justifyContent: 'flex-end' }}>
              {activeRole === 'founder' ? (
                <button className="row-action" onClick={() => openCourseDrawer(null)}>
                  新建课程
                </button>
              ) : null}
              <button
                className="row-action"
                onClick={async () => {
                  const refreshed = await refreshCoursesContext('courses.library.refresh', '课程列表');
                  if (!refreshed) {
                    return;
                  }
                  onAction?.('courses.library.refresh', '查看课程列表');
                  onNavigatePage?.('courses');
                }}
              >
                展开课程表
              </button>
            </div>
          </div>
          {courseCards.length === 0 ? (
            <div className="small-note">课程尚未下发，请在课程表设置中完成发布。</div>
          ) : null}
        <div className="course-library-grid expanded">
            {courseCards.map((lesson, index) => (
              <button
                className={`course-library-card ${selectedId === lesson.id ? 'active' : ''}`}
                key={lesson.id}
                onClick={() => {
                  void handleSelectCourseCard(lesson);
                }}
              >
                <span className="small-note">课程 {index + 1}</span>
                <strong>{lesson.course}</strong>
                <p>{lesson.topic}</p>
                <small>{lesson.grade} · {lesson.classType} · {lesson.fee}</small>
                <small className="small-note">{lesson.student} · {lesson.time}</small>
                {activeRole === 'founder' ? <small className="small-note">点击可编辑</small> : null}
              </button>
            ))}
          </div>
      </section>

        <section className="panel home-section">
          <div className="section-headline">
            <div>
              <span>能力雷达</span>
              <h3>课程目标能力追踪</h3>
            </div>
          </div>
        <div className="skill-goal-grid">
          {COURSE_SKILL_GOALS.map((skill) => (
            <article className="skill-goal-card" key={skill.id}>
              <div className="practice-module-icon"><skill.icon size={20} /></div>
              <strong>{skill.title}</strong>
              <div className="learning-progress-bar">
                <span style={{ width: `${skill.value}%` }} />
              </div>
              <small>{skill.value}% 掌握</small>
            </article>
          ))}
        </div>
      </section>

      {activeRole === 'founder' && courseDrawerOpen ? (
        <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label={courseDrawerMode === 'edit' ? '编辑课程' : '新建课程'}>
          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <span>{courseDrawerMode === 'edit' ? '编辑课程' : '新建课程'}</span>
                <h3>{courseDrawerMode === 'edit' ? courseDraft.name || '未命名课程' : '创建一门新课程'}</h3>
              </div>
              <button className="row-action ghost" onClick={closeCourseDrawer}>关闭</button>
            </div>
            <div className="drawer-body">
              <label className="drawer-field">
                <span>课程名称</span>
                <input value={courseDraft.name} onChange={(event) => handleCourseDraftChange('name', event.target.value)} />
              </label>
              <div className="drawer-field-grid">
                <label className="drawer-field">
                  <span>年级</span>
                  <input value={courseDraft.grade} onChange={(event) => handleCourseDraftChange('grade', event.target.value)} />
                </label>
                <label className="drawer-field">
                  <span>班型</span>
                  <select value={courseDraft.classType} onChange={(event) => handleCourseDraftChange('classType', event.target.value)}>
                    <option value="small">小班课</option>
                    <option value="one_to_one">一对一</option>
                    <option value="large">大班课</option>
                  </select>
                </label>
              </div>
              <label className="drawer-field">
                <span>课程级别</span>
                <input value={courseDraft.level} onChange={(event) => handleCourseDraftChange('level', event.target.value)} />
              </label>
              <label className="drawer-field">
                <span>课程安排</span>
                <textarea value={courseDraft.schedule} onChange={(event) => handleCourseDraftChange('schedule', event.target.value)} rows={3} />
              </label>
              <div className="drawer-field-grid">
                <label className="drawer-field">
                  <span>开课时间</span>
                  <input
                    type="datetime-local"
                    value={courseDraft.startTime}
                    onChange={(event) => handleCourseDraftChange('startTime', event.target.value)}
                  />
                </label>
                <label className="drawer-field">
                  <span>课时长度</span>
                  <input
                    type="number"
                    min="0"
                    value={courseDraft.durationMinutes}
                    onChange={(event) => handleCourseDraftChange('durationMinutes', event.target.value)}
                  />
                </label>
              </div>
              <div className="drawer-field-grid">
                <label className="drawer-field">
                  <span>名额</span>
                  <input
                    type="number"
                    min="1"
                    value={courseDraft.capacity}
                    onChange={(event) => handleCourseDraftChange('capacity', event.target.value)}
                  />
                </label>
                <label className="drawer-field">
                  <span>收费标准（分）</span>
                  <input
                    type="number"
                    min="0"
                    value={courseDraft.priceCents}
                    onChange={(event) => handleCourseDraftChange('priceCents', event.target.value)}
                  />
                </label>
              </div>
              <div className="drawer-field-grid">
                <label className="drawer-field">
                  <span>状态</span>
                  <select value={courseDraft.status} onChange={(event) => handleCourseDraftChange('status', event.target.value)}>
                    <option value="active">进行中</option>
                    <option value="paused">已暂停</option>
                    <option value="closed">已结课</option>
                  </select>
                </label>
                <label className="drawer-field">
                  <span>老师ID</span>
                  <input value={courseDraft.teacherId} onChange={(event) => handleCourseDraftChange('teacherId', event.target.value)} />
                </label>
              </div>
              <label className="drawer-field">
                <span>封面地址</span>
                <input value={courseDraft.imageUrl} onChange={(event) => handleCourseDraftChange('imageUrl', event.target.value)} />
              </label>
              {courseDrawerError ? <div className="drawer-error">{courseDrawerError}</div> : null}
            </div>
            <div className="drawer-footer">
              <div className="small-note">
                {courseDrawerMode === 'edit' ? `课程ID：${courseDrawerCourseId}` : '新课程会写入课程库并同步到公开课程列表'}
              </div>
              <div className="hero-chip-row">
                <button className="row-action ghost" onClick={closeCourseDrawer} disabled={courseDrawerSubmitting}>取消</button>
                <button className="row-action" onClick={() => void handleSaveCourse()} disabled={courseDrawerSubmitting}>
                  {courseDrawerSubmitting ? '保存中...' : '保存课程'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function PracticePage({
  report,
  activeRole = '',
  initialPracticeModuleId = '',
  studentTodayTasks = [],
  studentReviewHistory = [],
  studentReviewMistakes = [],
  onRunAIAgent,
  onResetChallenge,
  onSubmitPracticeReview,
  onSubmitVoiceAssess,
  onAction
}) {
  const fallbackTasks = [
    { id: 't1', title: '词汇速通', done: false, note: '按课程进度完成当日单词复述与纠音' },
    { id: 't2', title: '语法训练', done: false, note: '重难点语法专项巩固' },
    { id: 't3', title: '阅读理解', done: false, note: '完成一组短文主旨定位与细节提取' },
    { id: 't4', title: '口语任务', done: false, note: '完成情景句式模仿与表达' }
  ];

  const buildPracticeTasks = () => {
    if (activeRole === 'student') {
      const tasksFromHistory = Array.isArray(studentReviewHistory) ? studentReviewHistory : [];
      if (tasksFromHistory.length > 0) {
        return tasksFromHistory.slice(0, 6).map((item, index) => ({
          id: item.id || item.taskId || `history-${index}`,
          title: item.title || item.taskName || item.task_type || '复盘任务',
          done: `${item.status || ''}`.trim() === 'done' || item.done,
          note: item.note || item.topic || item.result || item.strength || '复盘与建议'
        }));
      }

      const tasksFromToday = Array.isArray(studentTodayTasks) ? studentTodayTasks : [];
      if (tasksFromToday.length > 0) {
        return tasksFromToday.slice(0, 6).map((item, index) => ({
          id: item.id || item.taskId || `today-${index}`,
          title: item.title || item.taskName || item.courseName || '今日任务',
          done: `${item.status || ''}`.trim() === 'done' || `${item.status || ''}`.trim() === 'submitted',
          note: item.note || item.transcript || item.topic || '跟读 + 复述'
        }));
      }
    }

    return fallbackTasks;
  };

  const initialArena = PRACTICE_ARENAS.some((item) => item.id === initialPracticeModuleId)
    ? initialPracticeModuleId
    : PRACTICE_ARENAS[0].id;
  const [activeArenaId, setActiveArenaId] = useState(initialArena);
  const [tasks, setTasks] = useState(buildPracticeTasks);
  const activeArena = PRACTICE_ARENAS.find((item) => item.id === activeArenaId) || PRACTICE_ARENAS[0];
  const ActiveArenaIcon = activeArena.icon;
  const isParentReadOnly = activeRole === 'parent';
  const [challengeState, setChallengeState] = useState({
    running: false,
    rounds: 0,
    score: 0,
    completed: false
  });
  const [submittingTaskId, setSubmittingTaskId] = useState('');
  const [practiceHint, setPracticeHint] = useState('点击“开始学习”进入本模块内容。');

  useEffect(() => {
    setTasks(buildPracticeTasks());
    setChallengeState({
      running: false,
      rounds: 0,
      score: 0,
      completed: false
    });
    if (activeRole === 'student' && (Array.isArray(studentTodayTasks) && studentTodayTasks.length)) {
      setPracticeHint(`已加载 ${studentTodayTasks.length} 条今日任务，先从第一条开始。`);
    }
  }, [activeRole, studentTodayTasks, studentReviewHistory, studentReviewMistakes]);

  useEffect(() => {
    const nextArenaId = `${initialPracticeModuleId || ''}`.trim();
    if (!nextArenaId || !PRACTICE_ARENAS.some((item) => item.id === nextArenaId)) {
      return;
    }
    if (activeArenaId === nextArenaId) {
      return;
    }
    setActiveArenaId(nextArenaId);
    setPracticeHint('已定位到首页选中的练习模块。');
  }, [activeArenaId, initialPracticeModuleId]);

  const resetChallenge = async () => {
    if (isParentReadOnly) {
      setPracticeHint('家长视角仅查看练习与反馈，不直接重置学生任务。');
      onAction?.('practice', `家长查看练习模块：${activeArena.title}`);
      return;
    }

    if (!onResetChallenge) {
      setPracticeHint('当前不支持重置练习，请稍后重试。');
      onAction?.('practice', `重置练习失败：${activeArena.title}`);
      return;
    }

    setPracticeHint('正在重置练习...');

    try {
      const response = await onResetChallenge({
        action: 'exercise_generate',
        payload: {
          studentName: report?.student?.name || '当前学生',
          student: report?.student?.name || '当前学生',
          grade: report?.student?.grade || '五年级',
          difficulty: activeArena.level,
          topic: activeArena.title
        }
      });

      const output = response?.data?.output || response?.output || {};
      const outputTasks = Array.isArray(output.tasks) ? output.tasks : [];
      const nextTasks = outputTasks.length > 0 ? outputTasks.map((task, index) => {
        const taskText = typeof task === 'string'
          ? task
          : `${task?.title || ''}`.trim() || `${task?.name || task?.id || `任务 ${index + 1}`}`;
        return {
          id: `reset-${index + 1}`,
          title: taskText || `任务 ${index + 1}`,
          done: false,
          note: output?.difficulty || activeArena.title
        };
      }) : tasks;

      if (activeRole === 'student' && typeof onSubmitPracticeReview === 'function') {
        await Promise.resolve(onSubmitPracticeReview({
          taskType: 'practice_reset',
          title: `${activeArena.title} 练习重置`,
          answer: outputTasks.length > 0 ? outputTasks.join('；') : `${activeArena.title} 已重置`,
          score: 0,
          status: 'pending',
          payload: {
            action: 'reset',
            arenaId: activeArena.id,
            arenaTitle: activeArena.title,
            difficulty: activeArena.level,
            tasks: nextTasks.map((item) => ({
              title: item.title,
              note: item.note
            }))
          }
        }));
      }

      setChallengeState({
        running: false,
        rounds: 0,
        score: 0,
        completed: false
      });
      setTasks(nextTasks);
      setPracticeHint(output?.title || output?.content ? `已生成并保存新内容：${output.title || output.content}` : `已重置并保存 ${activeArena.title}`);
      onAction?.('practice', `重置练习：${activeArena.title}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重置练习失败';
      setPracticeHint(`重置练习失败：${errorMessage}`);
      onAction?.('practice', `重置练习失败：${activeArena.title}`);
    }
  };

  const toggleTask = (id) => {
    const nextTask = tasks.find((item) => item.id === id);
    setTasks((prev) => prev.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    )));

    if (onRunAIAgent && nextTask) {
      Promise.resolve(
        onRunAIAgent({
          action: 'feedback_from_lesson',
          payload: {
            studentName: report?.student?.name || '当前学生',
            student: report?.student?.name || '当前学生',
            topic: nextTask.title,
            strength: nextTask.done ? '已完成任务' : '任务推进中',
            weakness: nextTask.note,
            nextStep: nextTask.done ? '继续下一项内容' : '完成本项内容'
          }
        })
      ).catch(() => {});
    }
  };

  const submitPracticeTask = async (task) => {
    if (!task?.id) {
      return;
    }

    if (isParentReadOnly) {
      setPracticeHint('家长视角仅查看练习进度，不直接提交学生任务。');
      onAction?.('practice', `家长查看任务：${task.title}`);
      return;
    }

    if (activeRole === 'student' && typeof onSubmitPracticeReview === 'function') {
      setSubmittingTaskId(task.id);
      try {
        const result = await Promise.resolve(onSubmitPracticeReview({
          taskType: 'practice_task',
          title: task.title,
          answer: `${task.note || task.title || task.result || ''}`.trim(),
          score: task.done ? 100 : 60,
          status: 'done',
          studentId: report?.student?.id || report?.student?.studentId || '',
          payload: {
            source: 'practice_task',
            arenaId: activeArena.id,
            arenaTitle: activeArena.title,
            taskId: task.id,
            note: task.note || ''
          }
        }));

        const record = result?.data?.item || result?.data?.record || result?.item || {};
        const score = Number(record.score || 100);
        const resultText = record.answer || record.title || '练习已提交';

        setTasks((prev) => prev.map((item) => item.id === task.id
          ? { ...item, done: true, note: resultText, score }
          : item
        ));
        setPracticeHint(`已完成：${task.title}（${score}分）`);
        onAction?.('practice', `学生练习已提交：${task.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '评分提交失败';
        setPracticeHint(`评分失败：${message}`);
        onAction?.('practice', `学生练习提交失败：${task.title}`);
      } finally {
        setSubmittingTaskId('');
      }

      return;
    }

    toggleTask(task.id);
  };

  const handleStartChallenge = () => {
    if (isParentReadOnly) {
      setPracticeHint('家长视角仅查看练习流程，不直接开始学生训练。');
      onAction?.('practice', `家长查看练习流程：${activeArena.title}`);
      return;
    }

    setChallengeState((prev) => ({
      ...prev,
      running: true,
      rounds: 0,
      score: 0,
      completed: false
    }));
    setPracticeHint(`已开始 ${activeArena.title}，点下方选项继续。`);
    onAction?.('practice', `开始学习：${activeArena.title}`);

    if (onRunAIAgent) {
      Promise.resolve(
        onRunAIAgent({
          action: 'exercise_generate',
          payload: {
            studentName: report?.student?.name || '当前学生',
            student: report?.student?.name || '当前学生',
            grade: report?.student?.grade || '五年级',
            difficulty: activeArena.level,
            topic: activeArena.title
          }
        })
      )
        .then((payload) => {
          const output = payload?.data?.output || payload?.output || payload?.data || {};
          const tasksText = Array.isArray(output.tasks) ? output.tasks.join('；') : '';
          setPracticeHint(tasksText ? `${activeArena.title} 已生成：${tasksText}` : `已开始 ${activeArena.title}，点下方选项继续。`);
        })
        .catch(() => {
          setPracticeHint(`已开始 ${activeArena.title}，点下方选项继续。`);
        });
    }
  };

  const handleTaskChoice = (choice) => {
    if (isParentReadOnly) {
      setPracticeHint('家长视角仅查看练习步骤，不直接操作学生训练。');
      return;
    }

    if (!challengeState.running) {
      setPracticeHint('请先启动训练后再操作。');
      return;
    }
    setChallengeState((prev) => {
      const nextRounds = prev.rounds + 1;
      const nextScore = prev.score + 12;
      const done = nextRounds >= activeArena.actions.length;
      setPracticeHint(
        done
          ? `本次练习已完成，得分 ${nextScore} 分，继续选择模块可查看其他内容。`
          : `已完成第 ${nextRounds} 步，当前得分 ${nextScore} 分。`
      );
      onAction?.('practice', `练习操作：${choice}`);

      if (activeRole === 'student' && typeof onSubmitPracticeReview === 'function') {
        Promise.resolve(onSubmitPracticeReview({
          taskType: 'practice_choice',
          title: `${activeArena.title} · ${choice}`,
          answer: choice,
          score: nextScore,
          status: done ? 'done' : 'pending',
          studentId: report?.student?.id || report?.student?.studentId || '',
          payload: {
            source: 'practice_choice',
            arenaId: activeArena.id,
            arenaTitle: activeArena.title,
            round: nextRounds,
            choice
          }
        })).catch(() => {});
      }

      if (onRunAIAgent) {
        Promise.resolve(
          onRunAIAgent({
            action: 'feedback_from_lesson',
            payload: {
              studentName: report?.student?.name || '当前学生',
              student: report?.student?.name || '当前学生',
              topic: `${activeArena.title} · ${choice}`,
              strength: `当前轮次 ${nextRounds}`,
              weakness: `得分 ${nextScore}`,
              nextStep: done ? '切换到下一模块' : '继续本模块内容'
            }
          })
        ).catch(() => {});
      }

      return {
        running: !done,
        rounds: nextRounds,
        score: nextScore,
        completed: done
      };
    });
  };

  const completed = tasks.filter((task) => task.done).length;
  const recentPractice = Array.isArray(studentReviewHistory)
    ? studentReviewHistory.slice(0, 3)
    : [];
  const weakFocusItems = Array.isArray(studentReviewMistakes)
    ? studentReviewMistakes.slice(0, 3)
    : [];
  const heroMetrics = [
    {
      id: 'task-progress',
      label: '今日任务',
      value: `${completed}/${tasks.length}`,
      tone: 'mint'
    },
    {
      id: 'rounds',
      label: '当前轮次',
      value: `${challengeState.rounds}/${activeArena.actions.length}`,
      tone: 'sky'
    },
    {
      id: 'score',
      label: '本次得分',
      value: `${challengeState.score}`,
      tone: 'sun'
    }
  ];

  return (
    <div className="product-page practice-page">
      <section className="panel page-banner practice-world-banner">
        <div className="practice-world-copy">
          <span>学习练习</span>
          <h3>学习练习工作台</h3>
          <p>练习任务按课程计划下发，提交后立即回填到复盘、错题诊断与课时执行日志。</p>
          <div className="practice-hero-metrics">
            {heroMetrics.map((metric) => (
              <div className={`practice-metric-tile ${metric.tone}`} key={metric.id}>
                <small>{metric.label}</small>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="practice-hero-side">
          <div className="practice-streak-card">
            <Flame size={20} />
            <strong>7 天</strong>
            <small>持续练习</small>
            <div className="small-note">当前模块：{activeArena.title}</div>
          </div>
          <div className="practice-focus-card">
            <span>练习反馈</span>
            <strong>{challengeState.completed ? '本轮已完成' : '准备开始'}</strong>
            <p>{practiceHint}</p>
            <div className="energy-meter">
              <span className="energy-meter-track" style={{ width: `${activeArena.energy}%` }} />
              <em className="energy-meter-label">{activeArena.energy}%</em>
            </div>
          </div>
        </div>
      </section>

      {isParentReadOnly ? (
        <section className="panel practice-readonly-panel">
          <div className="section-headline">
            <div>
              <span>家长只读视角</span>
              <h3>当前页面用于查看练习进度与反馈</h3>
            </div>
          </div>
          <p className="small-note">学生提交、重置和 AI 生成练习由学生端或老师端执行，家长端保留进度核对和反馈查看。</p>
        </section>
      ) : null}

      <div className="feature-split">
        <section className="panel mission-panel">
          <div className="section-headline">
            <div>
              <span>今日任务</span>
              <h3>{tasks.length > 0 ? `完成进度 ${completed}/${tasks.length}` : '暂无待执行任务'}</h3>
            </div>
          </div>
          <div className="mission-grid">
            {tasks.map((task) => (
              <article className={`mission-item ${task.done ? 'done' : ''}`} key={task.id}>
                <div className="mission-item-body">
                  <span className="mission-check">{task.done ? <Check size={16} /> : <Play size={16} />}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.note}</small>
                  </div>
                </div>
                <button
                  className="row-action"
                  onClick={() => submitPracticeTask(task)}
                  disabled={submittingTaskId === task.id || isParentReadOnly}
                >
                  {isParentReadOnly ? '仅查看' : submittingTaskId === task.id ? '提交中...' : task.done ? '已提交' : '开始学习'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel practice-zone-panel">
          <div className="section-headline">
            <div>
              <span>练习模块</span>
              <h3>选择学习模块</h3>
            </div>
          </div>
          <p className="practice-zone-note">每个模块对应独立训练流程，可直接开始并获取结果回填。</p>
          <div className="practice-arena-list">
            {PRACTICE_ARENAS.map((module) => (
              <button
                className={`practice-arena-card ${activeArenaId === module.id ? 'active' : ''}`}
                key={module.id}
                onClick={() => {
                  setActiveArenaId(module.id);
                  setChallengeState({
                    running: false,
                    rounds: 0,
                    score: 0,
                    completed: false
                  });
                  onAction?.('practice', `切换练习模块：${module.title}`);
                }}
              >
                <div className="practice-module-icon">
                  <module.icon size={20} />
                </div>
                <strong>{module.title}</strong>
                <p>{module.desc}</p>
                <small>{module.level} · 能量 {module.energy}%</small>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="feature-split practice-play-layout">
        <section className="panel practice-play-panel">
          <div className="section-headline">
            <div>
              <span>{activeArena.level}</span>
              <h3>{activeArena.title}</h3>
            </div>
            <div className="practice-play-summary">
              <span className="small-note">阶段 {challengeState.completed ? '完成' : '进行中'}</span>
              <span className="small-note">得分 {challengeState.score}</span>
            </div>
            <button
              className="row-action"
              onClick={handleStartChallenge}
              disabled={challengeState.running && !challengeState.completed}
            >
              {isParentReadOnly ? '仅查看' : challengeState.running && !challengeState.completed ? '进行中' : '开始学习'}
            </button>
          </div>
          <div className="game-preview-board">
            <div className="game-prompt-card">
              <ActiveArenaIcon size={24} />
              <strong>{activeArena.prompt}</strong>
              <small>{activeArena.desc}</small>
            </div>
            <div className="game-choice-row">
              {activeArena.actions.map((action, index) => (
                <button className="game-choice" key={action} onClick={() => handleTaskChoice(action)} disabled={isParentReadOnly}>
                  <span>{index + 1}</span>
                  {action}
                </button>
              ))}
            </div>
            <div className="hero-chip-row">
              <span className="small-note">得分 {challengeState.score}</span>
              <span className="small-note">轮次 {challengeState.rounds}/{activeArena.actions.length}</span>
              <span className="small-note">{challengeState.completed ? '已完成' : '进行中'}</span>
            </div>
            <div className="energy-meter">
              <span className="energy-meter-track" style={{ width: `${activeArena.energy}%` }} />
              <em className="energy-meter-label">{activeArena.energy}%</em>
            </div>
            <div className="small-note" style={{ marginTop: 12 }}>{practiceHint}</div>
            <button className="row-action" onClick={resetChallenge} disabled={isParentReadOnly}>重置内容</button>
          </div>
        </section>

          <section className="panel practice-feedback-panel">
          <div className="section-headline">
            <div>
              <span>练习反馈</span>
              <h3>结果回填与错题闭环</h3>
            </div>
          </div>
          <div className="feedback-mini-stack">
            <div className="detail-bubble">
              <strong>进步观察</strong>
              <p>{report.strength}</p>
            </div>
            <div className="detail-bubble">
              <strong>薄弱点</strong>
              <p>{report.weakness}</p>
            </div>
            <div className="detail-bubble">
              <strong>后续建议</strong>
              <p>{report.nextStep}</p>
            </div>
          </div>
          <div className="practice-review-list">
            <div className="practice-review-head">
              <strong>最近复盘</strong>
              <small>{recentPractice.length} 条</small>
            </div>
            {recentPractice.length > 0 ? (
              recentPractice.map((item, index) => (
                <article className="practice-review-item" key={item.id || item.title || index}>
                  <div>
                    <strong>{item.title || item.taskName || item.task_type || '练习复盘'}</strong>
                    <p>{item.result || item.note || item.topic || item.summary || '完成后会自动写回记录。'}</p>
                  </div>
                  <span>{item.status || item.tag || '已回填'}</span>
                </article>
              ))
            ) : (
              <div className="practice-empty-note">暂无复盘记录，完成一次练习后将自动生成。</div>
            )}
          </div>
          <div className="practice-review-list">
            <div className="practice-review-head">
              <strong>弱项聚焦</strong>
              <small>{weakFocusItems.length} 条</small>
            </div>
            {weakFocusItems.length > 0 ? (
              weakFocusItems.map((item, index) => (
                <article className="practice-review-item weak" key={item.id || item.title || index}>
                  <div>
                    <strong>{item.title || item.topic || '薄弱点'}</strong>
                    <p>{item.note || item.detail || item.summary || '后续会自动排进下一轮练习。'}</p>
                  </div>
                  <span>待加强</span>
                </article>
              ))
            ) : (
              <div className="practice-empty-note">暂无弱项记录，完成练习后将自动生成分析。</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfilePage({
  child,
  report,
  cultureWall = {},
  childMessages = [],
  onRefresh,
  onExportReport,
  onRunAIAgent,
  onCreateChildMessage,
  onAction,
  onNavigatePage,
  onRefreshCultureWall,
  lessonAccountSourceLabel = '课时账户接口',
  lessonAccount = {},
  childCourses = []
}) {
  const [reportStatus, setReportStatus] = useState(UI_COPY.status.pending);
  const [isExporting, setIsExporting] = useState(false);
  const [parentMessage, setParentMessage] = useState(report.summary);
  const [feedbacking, setFeedbacking] = useState(false);
  const [parentStatus, setParentStatus] = useState('处理中');
  const [cultureWallStatus, setCultureWallStatus] = useState('待同步');
  const [lessonAccountSyncAt, setLessonAccountSyncAt] = useState('');
  const [lessonAccountSyncState, setLessonAccountSyncState] = useState('待同步');
  const latestChildMessage = useMemo(() => (
    Array.isArray(childMessages) && childMessages.length > 0 ? childMessages[0] : null
  ), [childMessages]);
  const completedDays = WEEKLY_STREAK.filter((day) => day.done).length;
  const lessonHours = Number(
    child.hoursLeft
      || lessonAccount?.summary?.remaining
      || lessonAccount?.remainingHours
      || lessonAccount?.summary?.remaining_hours
      || 0
  );
  const courseCount = Array.isArray(childCourses) ? childCourses.length : 0;
  const cultureWallCounts = {
    videos: Array.isArray(cultureWall.videos) ? cultureWall.videos.length : 0,
    photos: Array.isArray(cultureWall.photos) ? cultureWall.photos.length : 0,
    teachers: Array.isArray(cultureWall.teachers) ? cultureWall.teachers.length : 0,
    feedback: Array.isArray(cultureWall.feedback) ? cultureWall.feedback.length : 0
  };
  const lessonAccountSummary = lessonAccount?.summary || {};
  const lessonAccountSource = `${lessonAccountSourceLabel || '课时账户接口'}`.trim();

  useEffect(() => {
    const nextAt = new Date().toLocaleString('zh-CN', { hour12: false });
    setLessonAccountSyncAt(nextAt);
    setLessonAccountSyncState('已同步');
  }, [lessonAccount, lessonAccountSourceLabel]);

  const refreshLessonAccount = async () => {
    if (typeof onRefresh !== 'function') {
      setLessonAccountSyncState('刷新服务暂不可用');
      return false;
    }

    setLessonAccountSyncState('同步中...');
    try {
      await Promise.resolve(onRefresh());
      setLessonAccountSyncAt(new Date().toLocaleString('zh-CN', { hour12: false }));
      setLessonAccountSyncState('已同步');
      onAction?.('profile', `课时账户已从${lessonAccountSource}刷新`);
      return true;
    } catch (error) {
      setLessonAccountSyncState(`同步失败：${error instanceof Error ? error.message : '请重试'}`);
      return false;
    }
  };

  const handleOpenCultureWall = async () => {
    if (onRefreshCultureWall) {
      setCultureWallStatus('学习成果同步中...');
      try {
        await onRefreshCultureWall();
        setCultureWallStatus('学习成果同步完成');
      } catch (error) {
        setCultureWallStatus(`学习成果同步失败：${error instanceof Error ? error.message : '请重试'}`);
      }
    }

    onNavigatePage?.('culture-wall');
  };

  const retryCultureWall = async () => {
    if (cultureWallStatus.startsWith('学习成果同步失败') && onRefreshCultureWall) {
      await handleOpenCultureWall();
    }
  };
  const handleProfileNavigate = async (targetPage, actionText, context = {}) => {
    if (onRefresh) {
      try {
        await Promise.resolve(onRefresh());
      } catch {
        // 刷新失败不中断跳转
      }
    }
    if (targetPage) {
      onNavigatePage?.(targetPage, context && typeof context === 'object' ? context : {});
    }
    if (actionText && onAction) {
      onAction('profile', actionText);
    }
  };
  const profileQuickActions = [
    {
      id: 'courses',
      label: '课程与课表',
      hint: '查看在读课程与本周课程安排',
      action: () => {
        const nextCourseId = Array.isArray(childCourses) && childCourses[0]
          ? (childCourses[0].id || childCourses[0].courseId || childCourses[0].course_id || '')
          : '';
        void handleProfileNavigate('courses', '个人中心进入课程与课表', {
          selectedChildId: child?.id || '',
          selectedCourseId: nextCourseId
        });
      }
    },
    {
      id: 'practice',
      label: '学习练习',
      hint: '进入学习练习与错题闭环',
      action: () => {
        void handleProfileNavigate('practice', '个人中心进入学习练习');
      }
    },
    {
      id: 'culture-wall',
      label: '学习成果馆',
      hint: '查看课程素材、课堂视频与家校反馈',
      action: () => {
        void handleOpenCultureWall();
      }
    },
    {
      id: 'report',
      label: '导出阶段报告',
      hint: '导出阶段成绩与建议的正式版本',
      action: () => exportReport()
    },
    {
      id: 'feedback',
      label: '生成家校沟通稿',
      hint: '一键生成可直接发送的家校沟通稿',
      action: () => generateParentMessage()
    }
  ];
  const profileHeroStats = [
    {
      id: 'hours',
      label: '剩余课时',
      value: `${lessonHours} 节`,
      note: '课时到账与消耗已同步'
    },
    {
      id: 'courses',
      label: '在读课程',
      value: `${courseCount} 门`,
      note: '课程列表自动同步'
    },
    {
      id: 'culture',
      label: '学习成果',
      value: `${cultureWallCounts.videos + cultureWallCounts.photos} 个`,
      note: '课堂内容与活动素材已归档'
    },
    {
      id: 'progress',
      label: '学习进度',
      value: `${child.progress}%`,
      note: '阶段进度每半日更新'
    }
  ];

  useEffect(() => {
    setParentMessage(latestChildMessage?.message || report.summary || '阶段总结生成中');
    setParentStatus(latestChildMessage ? '已同步到家校沟通记录' : '处理中');
  }, [latestChildMessage, report.summary]);

  const exportReport = async () => {
    if (!onExportReport) {
      setReportStatus('导出失败：导出服务暂不可用，请稍后重试');
      setParentStatus('导出失败');
      onAction?.('profile', '导出阶段报告失败：导出服务暂不可用，请稍后重试');
      return;
    }

    setIsExporting(true);
    setReportStatus(UI_COPY.loading.refreshing);

    try {
      await Promise.resolve(onRefresh?.());
      await Promise.resolve(onExportReport());
      setReportStatus(`已导出 · ${new Date().toLocaleString('zh-CN', { hour12: false })}`);
      onAction?.('profile', '导出阶段报告');
      setParentStatus('报告导出完成');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      setReportStatus(`导出失败：${errorMessage}`);
      setParentStatus('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const generateParentMessage = async () => {
    setFeedbacking(true);
    setParentStatus('生成中...');

    try {
      const response = await Promise.resolve(
        onRunAIAgent?.({
          action: 'feedback_from_lesson',
          payload: {
            studentName: child.name,
            student: child.name,
            topic: report.summary || '本周课堂内容',
            strength: report.strength,
            weakness: report.weakness,
            nextStep: report.nextStep
          }
        })
      );
      const output = response?.data?.output || response?.output || response?.data || {};
      const nextMessage = `${output.content || output.title || ''}`.trim() || [
        `【家长可读】${report.summary}`,
        `本周进步：${report.strength}`,
        `建议加强：${report.weakness}`,
        `下周目标：${report.nextStep}`
      ].join('；');
      setParentMessage(nextMessage);
      let savedMessage = null;
      if (typeof onCreateChildMessage === 'function') {
        savedMessage = await Promise.resolve(onCreateChildMessage({
          studentId: child?.id || '',
          payload: {
            actorRole: 'parent',
            sender: child?.name ? `${child.name} 家长` : '家长',
            message: nextMessage,
            tone: output.tone || '高情商',
            relatedLessonId: latestChildMessage?.relatedLessonId || latestChildMessage?.lessonId || ''
          }
        }));
      }
      setParentStatus(savedMessage ? '已生成并保存到家校沟通记录' : (output.title || '已生成'));
      onAction?.('profile', '生成家校反馈');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成失败';
      setParentStatus(`生成失败：${errorMessage}`);
    } finally {
      setFeedbacking(false);
    }
  };

  return (
    <div className="product-page">
      <section className="panel profile-summary-panel">
        <div className="section-headline">
          <div>
            <span>家长工作台</span>
            <h3>课程、课时与成长报告一体核对</h3>
          </div>
          <div className="profile-brand-badges">
            <span>成长记录</span>
            <span>课时管理</span>
            <span>学习成果</span>
          </div>
        </div>
        <section className="profile-hero-banner">
          <div className="profile-hero-copy">
            <span>家庭学习总览</span>
            <h3>一页核对课程进展、课时余额与阶段结果</h3>
            <p>
              课时、课程、阶段报告与家校反馈集中展示，支持课程质量、出勤与缴费记录持续追踪。
            </p>
            <div className="profile-hero-chip-row">
              <span>学习进度可核对</span>
              <span>课时状态透明</span>
              <span>家校反馈可复用</span>
            </div>
          </div>
          <div className="profile-hero-side">
            <div className="profile-hero-avatar-card">
              <div className="child-avatar">{child.name.slice(0, 1)}</div>
              <div>
                <strong>{child.name}</strong>
                <small>{child.grade} · {child.course}</small>
                <div className="small-note">连续学习第 {completedDays} 天</div>
              </div>
            </div>
            <div className="profile-hero-stat-grid">
              {profileHeroStats.map((item) => (
                <article className="profile-hero-stat-card" key={item.id}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
        <div className="profile-action-row">
          {profileQuickActions.map((item) => (
            <button className="profile-action-card" key={item.id} onClick={item.action}>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </button>
          ))}
        </div>
        <div className="profile-summary-shell">
          <section className="panel child-profile-card profile-cover-card">
            <div className="child-avatar">{child.name.slice(0, 1)}</div>
            <div>
            <span>学员档案</span>
              <h3>{child.name}</h3>
              <p>{child.grade} · {child.course}</p>
              <div className="profile-stat-strip">
                <span><Star size={16} /> 1250 星星</span>
                <span><Flame size={16} /> 连续 {completedDays} 天</span>
                <span><Gift size={16} /> {courseCount} 门课程</span>
              </div>
            </div>
          </section>
          <section className="panel child-progress-card profile-summary-card">
            <div className="growth-ring compact">
              <strong>{child.progress}%</strong>
              <span>学习进度</span>
            </div>
            <div>
              <strong>本周学习概况</strong>
              <p>{report.summary}</p>
              <div className="hero-chip-row">
                <span className="small-note">剩余课时 {lessonHours} 节</span>
                <span className="small-note">本周上课 3 节</span>
              </div>
            </div>
          </section>
        </div>
      </section>

        <section className="panel profile-account-panel">
          <div className="section-headline">
            <div>
              <span>课时账户</span>
            <h3>课时余额、课程与缴费记录一体看板</h3>
            </div>
          </div>
        <div className="metrics profile-account-metrics">
          <MetricCard
            icon={CalendarDays}
            label="剩余课时"
            value={`${lessonHours}节`}
            note="课时余额与消耗同步更新"
            tone="blue"
          />
          <MetricCard
            icon={BookOpenCheck}
            label="在读课程"
            value={`${courseCount}门`}
            note="当前学员课程总数"
            tone="green"
          />
          <MetricCard
            icon={Gift}
            label="连续天数"
            value={`${completedDays}天`}
            note="连续学习打卡可见"
            tone="yellow"
          />
          <MetricCard
            icon={CreditCard}
            label="缴费记录"
            value={`${lessonAccount?.summary?.paymentStatus || lessonAccount?.paymentStatus || '待确认'}`}
            note={`${lessonAccount?.summary?.paidAmount || lessonAccount?.paidAmount || '课时与收费已对账'}`}
            tone="purple"
          />
        </div>
        <div className="profile-sync-strip">
          <div>
            <span>数据来源</span>
            <strong>{lessonAccountSource}</strong>
            <small>{lessonAccountSummary.studentName || child.name || '当前学员'} · 最近同步后再看课时、收费和保留状态</small>
          </div>
          <div className="profile-sync-meta">
            <span className="small-note">最近同步：{lessonAccountSyncAt || '刚刚'}</span>
            <span className="small-note">{lessonAccountSyncState}</span>
            <button className="row-action ghost" onClick={() => void refreshLessonAccount()}>
              重新同步
            </button>
          </div>
        </div>
        <div className="profile-course-strip">
          <div className="section-headline compact">
            <div>
              <span>在读课程</span>
              <h3>最近课程清单（课程核对）</h3>
            </div>
          <button className="row-action" onClick={() => {
            void handleProfileNavigate('courses', '查看课程明细');
          }}>
            查看课程明细
          </button>
          </div>
          <div className="profile-course-grid">
            {(childCourses || []).slice(0, 3).map((course, index) => (
              <article className="profile-course-card" key={course.id || course.courseId || `${course.name || 'course'}-${index}`}>
                <span className="profile-course-index">{String(index + 1).padStart(2, '0')}</span>
                <strong>{course.course || course.courseName || course.title || '课程项'}</strong>
                <small>{course.grade || '年级待录入'} · {course.classType || '班型待录入'}</small>
                <div className="learning-progress-bar profile-course-progress">
                  <span style={{ width: `${Math.min(100, Number(course.progress || course.doneRate || 60))}%` }} />
                </div>
                <small>{course.time || '课程时间待确认'}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel profile-insight-panel">
        <div className="section-headline">
          <div>
            <span>成长与打卡</span>
            <h3>进度与打卡</h3>
          </div>
        </div>
        <div className="feature-split">
          <section className="panel profile-radar-panel">
            <div className="profile-radar-grid">
              {PROFILE_SKILL_RADAR.map((item) => (
                <article className="radar-row" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.value}%</small>
                  </div>
                  <div className="radar-track">
                    <span style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel weekly-card">
            <div className="weekly-streak-row">
              {WEEKLY_STREAK.map((day) => (
                <span className={day.done ? 'done' : ''} key={day.id}>
                  {day.done ? <Check size={16} /> : day.label}
                </span>
              ))}
            </div>
            <p className="large-text">连续学习情况将自动汇总为家长可读的阶段概况。</p>
          </section>
        </div>
      </section>

        <section className="panel profile-communication-panel">
        <div className="section-headline">
          <div>
            <span>沟通与报告</span>
            <h3>阶段报告与沟通</h3>
          </div>
        </div>
        <div className="feature-split">
          <section className="panel profile-report-card">
            <div className="section-headline">
              <div>
                <span>阶段报告</span>
                <h3>导出学习阶段报告</h3>
              </div>
              <button className="row-action" onClick={exportReport} disabled={isExporting}>
                {isExporting ? UI_COPY.loading.exporting : UI_COPY.actions.exportPdf}
              </button>
            </div>
            <ul className="check-list">
              <li><Sparkles size={16} /> 进步：{report.strength}</li>
              <li><TrendingUp size={16} /> 加强：{report.weakness}</li>
              <li><Star size={16} /> 下一步：{report.nextStep}</li>
            </ul>
            <div className="small-note">{reportStatus}</div>
          </section>

          <section className="panel parent-message-card">
            <div className="section-headline">
              <div>
                <span>家校沟通</span>
                <h3>沟通记录</h3>
              </div>
            </div>
            <p className="large-text">{parentMessage}</p>
            <button className="row-action" onClick={generateParentMessage} disabled={feedbacking}>
              {feedbacking ? '生成中...' : '生成家校反馈'}
            </button>
            <div className="small-note">
              家校反馈状态：{parentStatus} · 已存 {Array.isArray(childMessages) ? childMessages.length : 0} 条
            </div>
          </section>
        </div>
      </section>

        <section className="panel profile-activity-panel">
          <div className="section-headline">
            <div>
              <span>课程与成果</span>
              <h3>课程与成果核对</h3>
            </div>
            <button className="row-action" onClick={() => onNavigatePage?.('home')}>
            返回首页
          </button>
          </div>
        <div className="feature-split">
          <section className="panel profile-courses-panel home-section">
              <div className="section-headline">
                <div>
                  <span>在读课程</span>
                  <h3>课程核对清单</h3>
                </div>
              </div>
            {childCourses.length === 0 ? <div className="small-note">当前暂无在读课程</div> : null}
            <div className="alert-list">
              {(childCourses || []).slice(0, 6).map((course, index) => (
                <div className="alert-row" key={course.id || course.courseId || `${course.name || ''}-${index}`}>
                  <span className="status-dot blue" />
                  <div>
                    <strong>{getCourseDisplay(course).name}</strong>
                    <small>
                      {course.grade || '年级待录入'} · {normalizeCourseClassType(course)} · {normalizeCourseFee(course)}
                    </small>
                  </div>
                  <small className="small-note">{normalizeCourseTime(course)}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel profile-culture-panel">
              <div className="section-headline compact">
                <div>
                  <span>学习成果</span>
                  <h3>课堂视频 · 图片 · 家校反馈</h3>
                </div>
                <button className="row-action" onClick={() => {
                  void handleProfileNavigate('culture-wall', '查看学习成果馆');
                }}>
                  打开档案中心
                </button>
              </div>
            <div className="metrics">
              <MetricCard icon={Video} label="视频" value={`${cultureWallCounts.videos}条`} note="课堂过程记录" tone="blue" />
              <MetricCard icon={ImageIcon} label="图片" value={`${cultureWallCounts.photos}张`} note="课堂与活动留痕" tone="yellow" />
              <MetricCard icon={Camera} label="师资" value={`${cultureWallCounts.teachers}位`} note="教师信息展示" tone="green" />
              <MetricCard icon={MessageCircleHeart} label="反馈" value={`${cultureWallCounts.feedback}条`} note="沟通记录" tone="green" />
            </div>
            <div className="profile-culture-preview">
              <div className="profile-culture-preview-item">
                <span>视频</span>
                <strong>{cultureWallCounts.videos} 条</strong>
                <small>课堂过程记录可回看</small>
              </div>
              <div className="profile-culture-preview-item">
                <span>图片</span>
                <strong>{cultureWallCounts.photos} 张</strong>
                <small>活动与课堂留痕</small>
              </div>
              <div className="profile-culture-preview-item">
                <span>反馈</span>
                <strong>{cultureWallCounts.feedback} 条</strong>
                <small>家长和老师可查看</small>
              </div>
            </div>
            <div className="profile-sync-strip" style={{ marginTop: 12 }}>
              <div>
                <span>学习成果同步</span>
                <strong>{cultureWallStatus}</strong>
                <small>打开档案中心前会先刷新一次当前素材与反馈。</small>
              </div>
              <div className="profile-sync-meta">
                <span className="small-note">
                  {cultureWallStatus.startsWith('学习成果同步失败') ? '已保留重试入口' : '自动刷新后跳转'}
                </span>
                {cultureWallStatus.startsWith('学习成果同步失败') && onRefreshCultureWall ? (
                  <button className="row-action ghost" onClick={() => void retryCultureWall()}>
                    重试打开
                  </button>
                ) : null}
              </div>
            </div>
            <div className="profile-support-grid">
              {(cultureWall.feedback || []).slice(0, 1).map((item) => (
                <article className="feedback-item" key={item.id}>
                  <span>{item.role}</span>
                  <strong>{item.author}</strong>
                  <p>「{item.text}」</p>
                </article>
              ))}
              {(cultureWall.teachers || []).slice(0, 1).map((teacher) => (
                <article className="profile-card" key={teacher.id}>
                  <img className="profile-avatar" src={teacher.avatar} alt={teacher.name} />
                  <div className="media-body">
                    <strong>{teacher.name}</strong>
                    <small>{teacher.title}</small>
                    <p>{teacher.highlights.join(' · ')}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

const CULTURE_WALL_UPLOAD_RULES = {
  photo: {
    label: '图片',
    maxBytes: 12 * 1024 * 1024
  },
  video: {
    label: '视频',
    maxBytes: 120 * 1024 * 1024
  }
};

const formatUploadBytes = (bytes) => {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
};

const validateCultureWallUpload = (kind, file) => {
  const rule = CULTURE_WALL_UPLOAD_RULES[kind];
  if (!rule) {
    return '素材类型不支持';
  }

  const mimeType = `${file?.type || ''}`.toLowerCase();
  const size = Number(file?.size || 0);

  if (!file || typeof file.arrayBuffer !== 'function') {
    return '未选择可上传的文件';
  }

  if (kind === 'photo' && !mimeType.startsWith('image/')) {
    return '图片只能上传 image 类型文件';
  }

  if (kind === 'video' && !mimeType.startsWith('video/')) {
    return '视频只能上传 video 类型文件';
  }

  if (size <= 0) {
    return '文件大小不能为 0';
  }

  if (size > rule.maxBytes) {
    return `${rule.label}大小不能超过 ${formatUploadBytes(rule.maxBytes)}`;
  }

  return '';
};

function CultureWallSection({ data = {}, canEdit = false, onUploadAsset, onAction, ...sectionProps }) {
  const [videos, setVideos] = useState(() =>
    (data.videos || []).map((item) => ({
      ...item,
      kind: 'video',
      status: item.status || '已上传'
    }))
  );
  const [photos, setPhotos] = useState(() =>
    (data.photos || []).map((item) => ({
      ...item,
      kind: 'photo'
    }))
  );
  const [teachers, setTeachers] = useState(() =>
    (data.teachers || []).map((item) => ({
      ...item
    }))
  );
  const [feedbacks, setFeedbacks] = useState(() =>
    (data.feedback || []).map((item) => ({
      ...item
    }))
  );
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const pendingUploadRef = useRef(null);
  const uploadResetTimerRef = useRef(null);
  const [uploadTask, setUploadTask] = useState(null);
  const counts = {
    videos: videos.length,
    photos: photos.length,
    teachers: teachers.length,
    feedbacks: feedbacks.length
  };
  const lastUpdatedText = [
    ...(videos || []).map((item) => item.date).filter(Boolean),
    ...(photos || []).map((item) => item.date).filter(Boolean)
  ][0] || '素材待上传';

  useEffect(() => {
    setVideos(
      (data.videos || []).map((item) => ({
        ...item,
        kind: 'video',
        status: item.status || '已上传'
      }))
    );
    setPhotos(
      (data.photos || []).map((item) => ({
        ...item,
        kind: 'photo'
      }))
    );
    setTeachers(
      (data.teachers || []).map((item) => ({
        ...item
      }))
    );
    setFeedbacks(
      (data.feedback || []).map((item) => ({
        ...item
      }))
    );
  }, [data]);

  const resetUploadTask = () => {
    if (uploadResetTimerRef.current) {
      clearTimeout(uploadResetTimerRef.current);
      uploadResetTimerRef.current = null;
    }
    setUploadTask(null);
    pendingUploadRef.current = null;
  };

  const startUploadTask = (kind, file) => {
    const rule = CULTURE_WALL_UPLOAD_RULES[kind];
    const task = {
      kind,
      fileName: file.name,
      fileSize: file.size || 0,
      label: rule?.label || '素材',
      progress: 0,
      status: 'uploading',
      message: `正在上传${rule?.label || '素材'}：${file.name}`
    };
    pendingUploadRef.current = { kind, file };
    setUploadTask(task);
    return task;
  };

  const updateUploadProgress = (progress) => {
    setUploadTask((current) => {
      if (!current || current.status !== 'uploading') {
        return current;
      }

      return {
        ...current,
        progress: Math.max(current.progress || 0, Math.min(99, progress))
      };
    });
  };

  const submitUpload = async ({ kind, file, controlId }) => {
    const validationMessage = validateCultureWallUpload(kind, file);
    if (validationMessage) {
      pendingUploadRef.current = null;
      setUploadTask({
        kind,
        fileName: file?.name || '未知文件',
        fileSize: file?.size || 0,
        label: CULTURE_WALL_UPLOAD_RULES[kind]?.label || '素材',
        progress: 0,
        status: 'error',
        message: validationMessage
      });
      onAction?.(controlId, `上传失败：${validationMessage}`);
      return;
    }

    startUploadTask(kind, file);
    onAction?.(controlId, `开始上传：${kind === 'photo' ? '图片素材' : '教学视频'}（${file.name}）`);

    if (typeof onUploadAsset !== 'function') {
      pendingUploadRef.current = null;
      const message = '上传服务暂不可用';
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: CULTURE_WALL_UPLOAD_RULES[kind]?.label || '素材',
        progress: 0,
        status: 'error',
        message: `上传失败：${message}`
      });
      onAction?.(controlId, `上传失败：${message}`);
      return;
    }

    try {
      const nextWall = await onUploadAsset({
        kind,
        file,
        uploader: '当前管理员',
        onProgress: ({ progress }) => updateUploadProgress(progress || 0)
      });

      if (nextWall && nextWall.videos) {
        setVideos((nextWall.videos || []).map((item) => ({ ...item, kind: 'video', status: item.status || '已上传' })));
      }
      if (nextWall && nextWall.photos) {
        setPhotos((nextWall.photos || []).map((item) => ({ ...item, kind: 'photo' })));
      }
      if (nextWall && nextWall.teachers) {
        setTeachers((nextWall.teachers || []).map((item) => ({ ...item })));
      }
      if (nextWall && nextWall.feedback) {
        setFeedbacks((nextWall.feedback || []).map((item) => ({ ...item })));
      }

      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: CULTURE_WALL_UPLOAD_RULES[kind]?.label || '素材',
        progress: 100,
        status: 'success',
        message: `上传完成：${file.name}`
      });
      onAction?.(controlId, '上传完成');
      if (uploadResetTimerRef.current) {
        clearTimeout(uploadResetTimerRef.current);
      }
      uploadResetTimerRef.current = setTimeout(() => {
        if (pendingUploadRef.current?.file === file) {
          resetUploadTask();
        }
      }, 1400);
    } catch (error) {
      const message = error?.message || '请求失败';
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: CULTURE_WALL_UPLOAD_RULES[kind]?.label || '素材',
        progress: 0,
        status: 'error',
        message: `上传失败：${message}`
      });
      onAction?.(controlId, `上传失败：${message}`);
    }
  };

  const retryUpload = async () => {
    const pending = pendingUploadRef.current;
    if (!pending || !canEdit) {
      return;
    }

    await submitUpload({
      kind: pending.kind,
      file: pending.file,
      controlId: pending.kind === 'photo' ? 'culture-wall.prepare-upload-photo' : 'culture-wall.prepare-upload-video'
    });
  };

  const appendUpload = (kind, controlId) => async (evt) => {
    const file = evt.target.files?.[0];
    if (!file || !canEdit) {
      if (file && !canEdit) {
        onAction?.(controlId, '当前账号无权限上传');
      }
      evt.target.value = '';
      return;
    }

    await submitUpload({ kind, file, controlId });
    evt.target.value = '';
  };

  return (
    <section className="panel wide culture-wall" {...sectionProps}>
      <PanelTitle
        icon={ImageIcon}
        title="学习成果馆"
        action={
          canEdit ? (
            <span className="wall-upload-actions">
              <button className="row-action" onClick={() => imageInputRef.current?.click()} disabled={uploadTask?.status === 'uploading'}>
                <ImageIcon size={14} />
                上传图片素材
              </button>
              <button className="row-action" onClick={() => videoInputRef.current?.click()} disabled={uploadTask?.status === 'uploading'}>
                <Video size={14} />
                上传教学视频
              </button>
            </span>
          ) : null
        }
      />

      <div className="culture-intro-strip">
        <div>
          <span>档案总览</span>
          <strong>课堂记录、师资信息与家校反馈集中展示</strong>
          <small>更新后自动同步至首页与个人中心。</small>
        </div>
        <div className="culture-intro-tags">
          <span>视频 {counts.videos}</span>
          <span>图片 {counts.photos}</span>
          <span>老师 {counts.teachers}</span>
          <span>反馈 {counts.feedbacks}</span>
        </div>
      </div>

      {uploadTask ? (
        <div className={`culture-upload-status ${uploadTask.status}`}>
          <div className="culture-upload-status-head">
            <strong>{uploadTask.label}上传</strong>
            <span>
              {uploadTask.status === 'uploading'
                ? `${uploadTask.progress}%`
                : uploadTask.status === 'success'
                  ? '已完成'
                  : '需重试'}
            </span>
          </div>
          <div className="learning-progress-bar culture-upload-progress">
            <span style={{ width: `${Math.max(0, Math.min(100, uploadTask.progress || 0))}%` }} />
          </div>
          <small>{uploadTask.message}</small>
          {uploadTask.status === 'error' && pendingUploadRef.current?.file ? (
            <div className="culture-upload-retry">
              <button className="row-action ghost" onClick={() => void retryUpload()}>
                重试上传
              </button>
              <span className="small-note">保留上一次选择的文件，可直接重试。</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="culture-showcase">
        <article className="culture-spotlight">
          <div className="culture-spotlight-head">
            <div>
              <span>精选内容</span>
              <strong>{videos[0]?.title || photos[0]?.title || '课堂现场'}</strong>
              <small>{videos[0]?.description || photos[0]?.description || '展示机构真实课堂片段、图片与反馈内容。'}</small>
            </div>
            <span className="culture-spotlight-badge">首页同步展示</span>
          </div>
          <div className="culture-spotlight-media">
            {videos[0] ? (
              <video controls preload="metadata" src={videos[0].src} poster={videos[0].cover} />
            ) : photos[0] ? (
              <img src={photos[0].src} alt={photos[0].title} />
            ) : (
              <div className="culture-spotlight-empty">
                <ImageIcon size={24} />
                <strong>{UI_COPY.empty.noFeaturedContent}</strong>
                <small>上传课堂视频或活动图片后，将同步更新首页与个人中心。</small>
              </div>
            )}
          </div>
        </article>

        <div className="culture-mini-rail">
          <article className="culture-mini-card">
            <span>师资展示</span>
  <strong>{teachers[0]?.name || '教师待完善'}</strong>
  <small>{teachers[0]?.title || '请完善教师简介与教学亮点。'}</small>
          </article>
          <article className="culture-mini-card">
            <span>家校反馈</span>
  <strong>{feedbacks[0]?.author || '反馈待提交'}</strong>
  <small>{feedbacks[0]?.text || '家校反馈待提交。'}</small>
          </article>
          <article className="culture-mini-card">
              <span>档案总量</span>
              <strong>{counts.videos + counts.photos} 条</strong>
              <small>课程与活动素材形成一站式学习成果中心。</small>
          </article>
        </div>
      </div>

      <div className="metrics" style={{ marginTop: 12 }}>
        <MetricCard icon={Video} label="教学视频" value={`${counts.videos}条`} note="课堂过程记录" tone="blue" />
        <MetricCard icon={ImageIcon} label="活动照片" value={`${counts.photos}张`} note="课堂与活动留痕" tone="yellow" />
        <MetricCard icon={Camera} label="师资信息" value={`${counts.teachers}位`} note="教师信息展示" tone="green" />
        <MetricCard icon={MessageCircleHeart} label="家校反馈" value={`${counts.feedbacks}条`} note={`最近更新：${lastUpdatedText}`} tone="green" />
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="small-note">
          这里统一展示机构的课堂记录、教师信息和家校反馈。内容更新后可同步到首页与个人中心。
        </div>
      </div>

      <div className="culture-grid">
        <article className="culture-card">
          <PanelTitle icon={Video} title="教学视频走廊" />
  {videos.length === 0 ? <div className="small-note">课堂视频素材未上传。</div> : null}
          <div className="media-grid">
            {videos.map((video) => (
              <article className="media-item" key={video.id}>
                <div className="media-cover">
                  <img src={video.cover} alt="" />
                  <span className="media-badge">
                    <Play size={16} />
                    {video.duration || '00:00'}
                  </span>
                </div>
                <div className="media-body">
                  <strong>{video.title}</strong>
                  <small>{video.description}</small>
                  <small>上传者：{video.uploader} · {video.date}</small>
                  <div className="small-note">{video.status}</div>
                  <video controls preload="metadata" src={video.src} />
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="culture-card">
          <PanelTitle icon={ImageIcon} title="教学图片/活动照片" />
  {photos.length === 0 ? <div className="small-note">课堂活动图片素材未上传。</div> : null}
          <div className="media-grid photo-grid">
            {photos.map((photo) => (
              <article className="media-item" key={photo.id}>
                <div className="media-cover photo-cover">
                  <img src={photo.src} alt={photo.title} />
                </div>
                <div className="media-body">
                  <strong>{photo.title}</strong>
                  <small>{photo.description}</small>
                  <small>{photo.uploader} · {photo.date}</small>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="culture-card">
          <PanelTitle icon={Camera} title="师资展示" />
          {teachers.length === 0 ? <div className="small-note">师资资料待完善，请补充头像、职称与教学亮点。</div> : null}
          <div className="gallery-grid">
            {teachers.map((person) => (
              <article className="profile-card" key={person.id}>
                <img className="profile-avatar" src={person.avatar} alt={person.name} />
                <div className="media-body">
                  <strong>{person.name}</strong>
                  <small>{person.title}</small>
                  <p>{person.highlights.join(' · ')}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="culture-card">
          <PanelTitle icon={MessageCircleHeart} title="家校反馈" />
  {feedbacks.length === 0 ? <div className="small-note">当前暂无反馈，提交后将显示家长与学员评价。</div> : null}
          <div className="feedback-stack">
            {feedbacks.map((item) => (
              <div className="feedback-item" key={item.id}>
                <span>{item.role}</span>
                <strong>{item.author}</strong>
                <p>「{item.text}」</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      {canEdit ? (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={appendUpload('photo', 'culture-wall.prepare-upload-photo')}
            className="uploader-input"
            disabled={uploadTask?.status === 'uploading'}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={appendUpload('video', 'culture-wall.prepare-upload-video')}
            className="uploader-input"
            disabled={uploadTask?.status === 'uploading'}
          />
        </>
      ) : null}
    </section>
  );
}

function CultureWallPage({
  cultureWall = {},
  canEditCultureWall = false,
  onUploadCultureAsset,
  onRefreshCultureWall,
  onAction
}) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const pendingUploadRef = useRef(null);
  const uploadResetTimerRef = useRef(null);
  const [uploadTask, setUploadTask] = useState(null);

  const counts = {
    videos: Array.isArray(cultureWall.videos) ? cultureWall.videos.length : 0,
    photos: Array.isArray(cultureWall.photos) ? cultureWall.photos.length : 0,
    teachers: Array.isArray(cultureWall.teachers) ? cultureWall.teachers.length : 0,
    feedback: Array.isArray(cultureWall.feedback) ? cultureWall.feedback.length : 0
  };
  const latestMedia = [
    ...(Array.isArray(cultureWall.videos) ? cultureWall.videos : []),
    ...(Array.isArray(cultureWall.photos) ? cultureWall.photos : [])
  ].find((item) => item?.date || item?.updatedAt || item?.createdAt) || null;
  const cultureHeroCards = [
    {
      id: 'video',
      label: '课堂视频',
      value: `${counts.videos} 条`,
      note: '课堂过程可回看'
    },
    {
      id: 'photo',
      label: '活动图片',
      value: `${counts.photos} 张`,
      note: '活动与课堂留痕'
    },
    {
      id: 'teacher',
      label: '师资信息',
      value: `${counts.teachers} 位`,
      note: '教师介绍可查看'
    },
    {
      id: 'feedback',
      label: '家校反馈',
      value: `${counts.feedback} 条`,
      note: '家长与学员评价'
    }
  ];

  const resetUploadTask = () => {
    if (uploadResetTimerRef.current) {
      clearTimeout(uploadResetTimerRef.current);
      uploadResetTimerRef.current = null;
    }
    setUploadTask(null);
    pendingUploadRef.current = null;
  };

  const updateUploadProgress = (progress) => {
    setUploadTask((current) => {
      if (!current || current.status !== 'uploading') {
        return current;
      }

      return {
        ...current,
        progress: Math.max(current.progress || 0, Math.min(99, progress))
      };
    });
  };

  const submitUpload = async ({ kind, file, controlId }) => {
    const validationMessage = validateCultureWallUpload(kind, file);
    const rule = CULTURE_WALL_UPLOAD_RULES[kind];
    if (validationMessage) {
      pendingUploadRef.current = null;
      setUploadTask({
        kind,
        fileName: file?.name || '未知文件',
        fileSize: file?.size || 0,
        label: rule?.label || '素材',
        progress: 0,
        status: 'error',
        message: validationMessage
      });
      onAction?.(controlId, `上传失败：${validationMessage}`);
      return;
    }

    pendingUploadRef.current = { kind, file };
    setUploadTask({
      kind,
      fileName: file.name,
      fileSize: file.size || 0,
      label: rule?.label || '素材',
      progress: 0,
      status: 'uploading',
      message: `正在上传${rule?.label || '素材'}：${file.name}`
    });
    onAction?.(controlId, `开始上传：${kind === 'photo' ? '图片素材' : '教学视频'}（${file.name}）`);

    if (typeof onUploadCultureAsset !== 'function') {
      pendingUploadRef.current = null;
      const message = '上传服务暂不可用';
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: rule?.label || '素材',
        progress: 0,
        status: 'error',
        message: `上传失败：${message}`
      });
      onAction?.(controlId, `上传失败：${message}`);
      return;
    }

    try {
      const nextWall = await onUploadCultureAsset({
        kind,
        file,
        uploader: '当前管理员',
        onProgress: ({ progress }) => updateUploadProgress(progress || 0)
      });

      onAction?.(controlId, nextWall ? `上传完成：${file.name}` : '上传完成：本次未返回同步数据');
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: rule?.label || '素材',
        progress: 100,
        status: 'success',
        message: `上传完成：${file.name}`
      });
      if (uploadResetTimerRef.current) {
        clearTimeout(uploadResetTimerRef.current);
      }
      uploadResetTimerRef.current = setTimeout(() => {
        if (pendingUploadRef.current?.file === file) {
          resetUploadTask();
        }
      }, 1400);
    } catch (error) {
      const message = error?.message || '请求失败';
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: rule?.label || '素材',
        progress: 0,
        status: 'error',
        message: `上传失败：${message}`
      });
      onAction?.(controlId, `上传失败：${message}`);
    }
  };

  const refreshCultureWall = async (controlId, message) => {
    if (typeof onRefreshCultureWall !== 'function') {
      onAction?.(controlId, `${message || '数据刷新'}失败：服务暂不可用`);
      return false;
    }

    try {
      await onRefreshCultureWall();
      onAction?.(controlId, `${message || '文化墙数据刷新'}成功`);
      return true;
    } catch (error) {
      onAction?.(controlId, `${message || '文化墙数据刷新'}失败：${error?.message || '请求失败'}`);
      return false;
    }
  };

  const triggerUpload = (kind, controlId) => async (evt) => {
    const file = evt.target.files?.[0];
    if (!file || !canEditCultureWall) {
      return;
    }

    await submitUpload({ kind, file, controlId });
    evt.target.value = '';
  };

  return (
    <div className="product-page">
      <section className="panel page-banner culture-wall-banner">
          <div className="culture-wall-copy">
            <span>学习成果馆</span>
            <h3>课程成果与反馈总览</h3>
            <p>家长、老师与机构统一查看课堂视频、活动照片、课程素材和家校反馈，更新将同步到首页与个人中心。</p>
            <div className="culture-wall-chip-row">
            <span className="small-note">首页同步</span>
            <span className="small-note">个人中心同步</span>
            <span className="small-note">成果一体</span>
  <span className="small-note">{latestMedia?.date || latestMedia?.updatedAt || latestMedia?.createdAt || '暂无更新时间'}</span>
          </div>
        </div>
        <div className="culture-wall-hero-side">
          <div className="culture-wall-sync-card">
            <strong>同步状态</strong>
            <p>当前内容已经对接首页与个人中心展示位，更新后会同步显示。</p>
            <div className="culture-wall-sync-pills">
            <span>首页</span>
            <span>个人中心</span>
            <span>成果馆</span>
          </div>
        </div>
          <div className="culture-wall-actions">
            <button
              className="row-action"
              disabled={uploadTask?.status === 'uploading'}
              onClick={async () => {
                await refreshCultureWall('culture-wall.view-home-sync', '查看首页同步展示');
              }}
            >
              查看首页同步
            </button>
            {canEditCultureWall ? (
              <>
                <button className="row-action" onClick={() => imageInputRef.current?.click()} disabled={uploadTask?.status === 'uploading'}>
                  上传图片素材
                </button>
                <button className="row-action" onClick={() => videoInputRef.current?.click()} disabled={uploadTask?.status === 'uploading'}>
                  上传教学视频
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {uploadTask ? (
        <section className={`panel culture-upload-status ${uploadTask.status}`}>
          <div className="culture-upload-status-head">
            <strong>{uploadTask.label}上传</strong>
            <span>
              {uploadTask.status === 'uploading'
                ? `${uploadTask.progress}%`
                : uploadTask.status === 'success'
                  ? '已完成'
                  : '需重试'}
            </span>
          </div>
          <div className="learning-progress-bar culture-upload-progress">
            <span style={{ width: `${Math.max(0, Math.min(100, uploadTask.progress || 0))}%` }} />
          </div>
          <small>{uploadTask.message}</small>
          {uploadTask.status === 'error' && pendingUploadRef.current?.file ? (
            <div className="culture-upload-retry">
              <button className="row-action ghost" onClick={() => void submitUpload({
                kind: pendingUploadRef.current?.kind,
                file: pendingUploadRef.current?.file,
                controlId: pendingUploadRef.current?.kind === 'photo'
                  ? 'culture-wall.prepare-upload-photo'
                  : 'culture-wall.prepare-upload-video'
              })}>
                重试上传
              </button>
              <span className="small-note">保留上一次选择的文件，可直接重试。</span>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="panel culture-wall-overview">
        <div className="section-headline">
          <div>
            <span>内容概览</span>
            <h3>四类内容统一查看</h3>
          </div>
          <button
            className="row-action ghost"
            disabled={uploadTask?.status === 'uploading'}
            onClick={async () => {
              await refreshCultureWall('culture-wall.view-all', '查看全部内容');
            }}
          >
            查看更多
          </button>
        </div>
        <div className="culture-wall-summary-grid">
          {cultureHeroCards.map((card) => (
            <article className="culture-wall-summary-card" key={card.id}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </article>
          ))}
        </div>
      </section>

      <CultureWallSection
        data={cultureWall}
        canEdit={canEditCultureWall}
        onUploadAsset={onUploadCultureAsset}
        onAction={onAction}
      />
      {canEditCultureWall ? (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={triggerUpload('photo', 'culture-wall.prepare-upload-photo')}
            className="uploader-input"
            disabled={uploadTask?.status === 'uploading'}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={triggerUpload('video', 'culture-wall.prepare-upload-video')}
            className="uploader-input"
            disabled={uploadTask?.status === 'uploading'}
          />
        </>
      ) : null}
    </div>
  );
}

function App() {
  const { isAdminRoute } = getAdminPathState();
  const isApiModeEnabled = isApiMode();
  const requiresAuth = isAdminRoute && isApiModeEnabled;
  const savedSession = loadSavedSession();
  const initTokenFromUrl = getInitTokenFromUrl();
  const initialToken = trimEnv(initTokenFromUrl || savedSession?.token || '');
  const initialAuthUser = savedSession?.user || null;
  const initRoleFromQuery = getInitRoleFromUrl();
  const initRoleFromSession = normalizeRoleInput(initialAuthUser?.role);
  const initRoleFallback = isApiModeEnabled ? 'platform' : (getInitRoleFromEnv());
  const publicDefaultRole = 'student';

  const [runtimeData, setRuntimeData] = useState(FALLBACK_DATA);
  const [activePage, setActivePage] = useState('home');
  const [pageContext, setPageContext] = useState({});
  const [activeStage, setActiveStage] = useState('age_7_10');
  const [operationLogs, setOperationLogs] = useState([]);
  const [actionToast, setActionToast] = useState('');
  const [actionCount, setActionCount] = useState(0);
  const actionToastTimerRef = useRef(null);
  const [activeRole, setActiveRole] = useState(() => {
    const roleFromUrl = getInitRoleFromUrl();
    const normalizedUrlRole = normalizeRoleInput(roleFromUrl);
    if (normalizedUrlRole) {
      return normalizedUrlRole;
    }

    if (isAdminRoute) {
      return (
        initRoleFromSession
        || normalizeRoleInput(getInitRoleFromEnv())
        || initRoleFallback
      );
    }

    if (initRoleFromSession && initRoleFromSession !== 'platform') {
      return initRoleFromSession;
    }

    return publicDefaultRole;
  });
  const initTokenRef = useRef(initialToken);
  const [authToken, setAuthToken] = useState(initialToken);
  const [isAuthReady, setIsAuthReady] = useState(!requiresAuth);
  const [isAuthenticated, setIsAuthenticated] = useState(!requiresAuth ? true : Boolean(initialAuthUser && initRoleFromSession));
  const [authUser, setAuthUser] = useState(initialAuthUser);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [platformActionOrgId, setPlatformActionOrgId] = useState('');
  const [platformActionMessage, setPlatformActionMessage] = useState('');
  const [platformWarningsVisible, setPlatformWarningsVisible] = useState(true);
  const [platformAuditFilters, setPlatformAuditFilters] = useState({
      institutionId: '',
    action: '',
    decision: '',
    userId: '',
    clientIp: '',
    startAt: '',
    endAt: '',
    limit: 20,
    offset: 0
  });
  const [platformAuditData, setPlatformAuditData] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    nextOffset: 0,
    sourceSummary: null,
    items: []
  });
  const [platformAuditLoading, setPlatformAuditLoading] = useState(false);
  const [platformAuditMessage, setPlatformAuditMessage] = useState('');
  const [platformAiUsageData, setPlatformAiUsageData] = useState({
    window: {
      days: 30,
      startAt: '',
      endAt: ''
    },
    totalInstitutions: 0,
    items: [],
    topUsers: []
  });
  const [platformAiUsageFilters, setPlatformAiUsageFilters] = useState({
    institutionId: '',
    days: 30,
    includeUsers: false,
    startAt: '',
    endAt: '',
    limit: 50,
    userLimit: 20
  });
  const [platformAiUsageLoading, setPlatformAiUsageLoading] = useState(false);
  const [platformAiUsageMessage, setPlatformAiUsageMessage] = useState('');
  const [publicCourses, setPublicCourses] = useState([]);
  const [publicCoursesLoading, setPublicCoursesLoading] = useState(false);
  const [publicLeadSubmitting, setPublicLeadSubmitting] = useState(false);
  const [publicLeadReplyLoading, setPublicLeadReplyLoading] = useState(false);
  const [studentTodayTasks, setStudentTodayTasks] = useState([]);
  const [studentReviewSummary, setStudentReviewSummary] = useState({});
  const [studentReviewHistory, setStudentReviewHistory] = useState([]);
  const [studentReviewMistakes, setStudentReviewMistakes] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [studentLessonAccount, setStudentLessonAccount] = useState({});
  const [studentChildMessages, setStudentChildMessages] = useState([]);
  const [studentVoicePractice, setStudentVoicePractice] = useState({});
  const [studentDataLoading, setStudentDataLoading] = useState(false);
  const [studentDataMessage, setStudentDataMessage] = useState('');
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [teacherExceptions, setTeacherExceptions] = useState([]);
  const [teacherDataLoading, setTeacherDataLoading] = useState(false);
  const [teacherDataMessage, setTeacherDataMessage] = useState('');
  const [parentChildren, setParentChildren] = useState([]);
  const [parentSelectedChildId, setParentSelectedChildId] = useState('');
  const [parentSummary, setParentSummary] = useState({});
  const [parentChildCourses, setParentChildCourses] = useState([]);
  const [parentChildLessonAccount, setParentChildLessonAccount] = useState({});
  const [parentChildPayments, setParentChildPayments] = useState([]);
  const [parentChildMessages, setParentChildMessages] = useState([]);
  const [parentDataLoading, setParentDataLoading] = useState(false);
  const [parentDataMessage, setParentDataMessage] = useState('');
  const [founderCockpit, setFounderCockpit] = useState({});
  const [founderCourses, setFounderCourses] = useState([]);
  const [founderLeads, setFounderLeads] = useState([]);
  const [founderPaymentRecords, setFounderPaymentRecords] = useState([]);
  const [founderLessonAccounts, setFounderLessonAccounts] = useState([]);
  const [founderAttendanceRecords, setFounderAttendanceRecords] = useState([]);
  const [founderDataLoading, setFounderDataLoading] = useState(false);
  const [founderDataMessage, setFounderDataMessage] = useState('');
  const [founderFilters, setFounderFilters] = useState({
    courseStatus: '',
    leadStatus: '',
    paymentStatus: '',
    paymentStudentId: '',
    paymentCourseId: '',
    paymentStartAt: '',
    paymentEndAt: '',
    startAt: '',
    endAt: ''
  });

  useEffect(() => {
    initTokenRef.current = trimEnv(authToken);
  }, [authToken]);

  const sanitizeOperationText = (raw) => {
    const safeText = `${raw || ''}`;
    return safeText
      .replace(/(GET|POST|PUT|DELETE|PATCH)\s+\/api\/v1\/[^\s"]+/gi, '[$1] 平台请求')
      .replace(/\/api\/v1\/[^\s"]+/g, '平台请求')
      .replace(/api request failed:\s*/gi, '请求失败：')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const appendOperationLog = (screen, text) => {
    const normalizedText = sanitizeOperationText(text);
    const message = `${screen || '系统'}：${normalizedText}`.trim();
    if (!message) {
      return;
    }
    setActionCount((value) => value + 1);
    setActionToast(message);
    if (actionToastTimerRef.current) {
      clearTimeout(actionToastTimerRef.current);
    }
    actionToastTimerRef.current = setTimeout(() => {
      setActionToast('');
      actionToastTimerRef.current = null;
    }, 1800);
    setOperationLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        text: message
      },
      ...prev
    ].slice(0, OPERATION_LOG_MAX));
  };

  useEffect(() => {
    return () => {
      if (actionToastTimerRef.current) {
        clearTimeout(actionToastTimerRef.current);
      }
    };
  }, []);

  const authGuardedRole = normalizeRoleInput(authUser?.role);
  const isRoleLocked = requiresAuth && isAuthenticated;

  useEffect(() => {
    if (!requiresAuth) {
      setIsAuthReady(true);
      setIsAuthenticated(true);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setIsAuthReady(false);
      setAuthMessage('');

      if (!initialToken) {
        setAuthToken('');
        clearSessionFromStorage();
        setAuthUser(null);
        setIsAuthenticated(false);
        setIsAuthReady(true);
        return;
      }

      if (initTokenFromUrl) {
        stripTokenFromUrl();
      }

      try {
        const response = await loadCurrentUser({ authToken: initialToken });
        const user = response?.data?.user || null;
        const normalizedUserRole = normalizeRoleInput(user?.role);
        if (!normalizedUserRole) {
          throw new Error('token 无效');
        }

        const nextUser = {
          ...user,
          role: normalizedUserRole
        };

        if (!cancelled) {
          saveSessionToStorage(initialToken, nextUser);
          setAuthUser(nextUser);
          setAuthToken(initialToken);
          setActiveRole(normalizedUserRole);
          setIsAuthenticated(true);
          initTokenRef.current = initialToken;
        }
      } catch {
        if (!cancelled) {
          clearSessionFromStorage();
          setAuthToken('');
          setAuthUser(null);
          initTokenRef.current = '';
          setActiveRole(initRoleFallback);
          setIsAuthenticated(false);
          setAuthMessage('登录已失效，请重新登录');
        }
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [requiresAuth, initTokenFromUrl, initialToken, initRoleFallback]);

  useEffect(() => {
    if (requiresAuth && !isAuthReady) {
      return;
    }

    if (requiresAuth && !isAuthenticated) {
      return;
    }

    let mounted = true;
    const role = activeRole;
    const token = trimEnv(authToken);

    loadRuntimeData({ role, authToken: token })
      .then((data) => {
        if (!mounted) return;
        setRuntimeData(data);
      })
      .catch((error) => {
        if (requiresAuth && (error?.status === 401 || error?.status === 403)) {
          clearSessionFromStorage();
          setAuthUser(null);
          setAuthToken('');
          initTokenRef.current = '';
          setActiveRole(initRoleFallback);
          setIsAuthenticated(false);
          setAuthMessage('登录已失效，请重新登录');
          setRuntimeData(FALLBACK_DATA);
          return;
        }

        if (!mounted) return;
        setRuntimeData(FALLBACK_DATA);
      });

    return () => {
      mounted = false;
    };
  }, [activeRole, authToken, isAuthReady, isAuthenticated, requiresAuth]);

  const switchRole = (nextRole) => {
    if (nextRole === activeRole) {
      return;
    }
    if (isRoleLocked) {
      return;
    }
    setActiveRole(nextRole);
    setPageContext({});
    appendOperationLog('角色', `切换到${nextRole}`);
  };

  const switchPage = (nextPage, context = {}) => {
    const targetPage = pageConfig.some((item) => item.id === nextPage) ? nextPage : 'home';
    setActivePage(targetPage);
    setPageContext(context && typeof context === 'object' ? context : {});
    appendOperationLog('页面', `切换到${(pageConfig.find((item) => item.id === targetPage)?.label || '首页')}`);
  };

  const roleTabs = useMemo(() => {
    const tabs = resolveMenuItems(runtimeData.menuConfig || MENU_CONFIG, 'roleTabs', Crown);
    return isRoleLocked && authGuardedRole
      ? tabs.filter((item) => item.id === authGuardedRole)
      : tabs;
  }, [runtimeData.menuConfig, authGuardedRole, isRoleLocked]);
  const appCopy = runtimeData.appCopy || FALLBACK_DATA.appCopy;
  const currentRole = roleTabs.find((tab) => tab.id === activeRole) || roleTabs[0];
  const pageConfig = useMemo(() => (activeRole === 'platform' ? PLATFORM_PAGE_CONFIG : PAGE_CONFIG), [activeRole]);
  const currentPage = pageConfig.find((item) => item.id === activePage) || pageConfig[0];
  const currentStage = AGE_GROUPS.find((item) => item.id === activeStage) || AGE_GROUPS[1];
  const shellTitle = appCopy.appShellTitle || 'Aggie速记英语';

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = shellTitle;
  }, [shellTitle]);

  const parentChild = parentSummary?.student || (runtimeData.students || FALLBACK_DATA.students)[0] || FALLBACK_DATA.students[0];
  const parentReport = parentSummary || (runtimeData.parentReports || FALLBACK_DATA.parentReports)[0] || FALLBACK_DATA.parentReports[0];
  const studentSummary = studentReviewSummary?.summary || studentReviewSummary || {};
  const child = activeRole === 'student'
    ? {
      id: studentSummary?.studentId || studentSummary?.id || studentLessonAccount?.studentId || parentChild?.id || '',
      name: studentSummary?.studentName || studentSummary?.name || parentChild?.name || '当前学员',
      grade: studentSummary?.grade || studentSummary?.studentGrade || parentChild?.grade || '五年级',
      progress: Number(studentSummary?.doneRate || studentSummary?.progress || 0),
      hoursLeft: Number(studentLessonAccount?.remainingHours || studentLessonAccount?.summary?.remaining || studentLessonAccount?.summary?.remaining_hours || 0),
      course: Array.isArray(studentCourses) && studentCourses[0]?.course
        ? studentCourses[0]?.course
        : Array.isArray(studentCourses) && studentCourses[0]?.name
          ? studentCourses[0]?.name
          : studentSummary?.course || parentChild?.course || '当前课程'
    }
    : parentChild;
  const report = activeRole === 'student'
    ? {
      summary: studentSummary?.summaryText || studentSummary?.text || `已完成 ${studentSummary?.done || 0}/${studentSummary?.total || 0} 项，平均分 ${studentSummary?.averageScore || 0}。`,
      strength: studentSummary?.strength || '本阶段保持稳定投入',
      weakness: studentSummary?.weakness || '建议加强复读和口语模仿',
      nextStep: studentSummary?.nextStep || studentSummary?.suggestion || '先做今日任务并提交语音评分',
      weekLearned: `${studentSummary?.done || 0}/${studentSummary?.total || 0}`
    }
    : parentReport;
  const runtimeLessons = runtimeData.teacherLessons || FALLBACK_DATA.teacherLessons;
  const lessons = (activeRole === 'teacher' ? teacherCourses : teacherCourses.length > 0 ? teacherCourses : runtimeLessons)
    || runtimeLessons;
  const admissionsMedia = (runtimeData.mediaLibrary?.assets || FALLBACK_DATA.mediaLibrary.assets || [])
    .filter((item) => `${item.placement || ''}`.trim() === 'admissions' && `${item.kind || ''}`.trim() === 'photo')
    .map((item) => ({ ...item }));
  const cultureWall = runtimeData.cultureWall || FALLBACK_DATA.cultureWall;
  const canManageCultureWallData = ['founder', 'platform'].includes(activeRole);
  const platformOrgs = runtimeData.organizations || FALLBACK_DATA.organizations;
  const selectedParentChildId = parentSelectedChildId || (parentChildren[0]?.studentId || parentChildren[0]?.id || parentChildren[0]?.student?.id || '');

  const loadPublicCourses = async () => {
    if (!isApiMode()) {
      setPublicCourses((runtimeData.teacherLessons || FALLBACK_DATA.teacherLessons).slice(0, 10));
      return;
    }
    setPublicCoursesLoading(true);
    try {
      const payload = await listPublicCourses({
        authToken: initTokenRef.current,
        filters: { limit: 20 }
      });
      const list = Array.isArray(payload?.data?.courses) ? payload.data.courses : [];
      setPublicCourses(list);
    } finally {
      setPublicCoursesLoading(false);
    }
  };

  const submitPublicLead = async (input = {}) => {
    setPublicLeadSubmitting(true);
    try {
      const fallbackInstitutionId = `${runtimeData?.organizations?.[0]?.id || runtimeData?.organizations?.[0]?.institution_id || ''}`.trim();
      const selectedCourseId = `${input.courseId || ''}`.trim();
      const matchedCourse = selectedCourseId
        ? publicCourses.find((course) => `${course.id}`.trim() === selectedCourseId)
        : null;
      const fallbackCourseInstitutionId = `${matchedCourse?.institutionId || ''}`.trim();
      const inputInstitutionId = `${input.institutionId || ''}`.trim();
      const resolvedInstitutionId = inputInstitutionId || fallbackCourseInstitutionId || fallbackInstitutionId;

      if (!resolvedInstitutionId) {
        throw new Error('咨询缺少 institutionId，请先选择课程并重试');
      }
      if (!`${input.guardianName || ''}`.trim()) {
        throw new Error('请填写家长姓名');
      }

      const leadPayload = await createPublicLead({
        authToken: initTokenRef.current,
        institutionId: resolvedInstitutionId,
        guardianName: `${input.guardianName || ''}`.trim(),
        studentGrade: `${input.studentGrade || ''}`.trim(),
        needSummary: `${input.needSummary || ''}`.trim(),
        initialMessage: `${input.initialMessage || ''}`.trim(),
        privacyConsent: true
      });
      return leadPayload;
    } finally {
      setPublicLeadSubmitting(false);
    }
  };

  const sendPublicLeadReply = async (input = {}) => {
    setPublicLeadReplyLoading(true);
    try {
      return sendLeadAiReply({
        authToken: initTokenRef.current,
        leadId: `${input.leadId || ''}`.trim(),
        message: `${input.message || ''}`.trim()
      });
    } finally {
      setPublicLeadReplyLoading(false);
    }
  };

  const submitTrialBooking = async (input = {}) => {
    const institutionId = `${input.institutionId || ''}`.trim();
    const leadId = `${input.leadId || ''}`.trim();
    const courseId = `${input.courseId || ''}`.trim();

    if (!leadId) {
      throw new Error('leadId is required');
    }
    if (!institutionId) {
      throw new Error('institutionId is required');
    }
    if (!courseId) {
      throw new Error('courseId is required');
    }

    const booking = await createTrialBooking({
      authToken: initTokenRef.current,
      leadId,
      institutionId,
      courseId,
      teacherId: `${input.teacherId || ''}`.trim(),
      reservedAt: `${input.reservedAt || ''}`.trim(),
      durationMinutes: Number(input.durationMinutes || 60),
      sourceChannel: `${input.sourceChannel || 'web'}`.trim(),
      notes: `${input.notes || ''}`.trim()
    });
    return booking;
  };

  const loadStudentData = async () => {
    setStudentDataLoading(true);
    setStudentDataMessage('');
    try {
      const [todayPathPayload, summaryPayload, historyPayload, mistakesPayload, coursesPayload, accountPayload] = await Promise.all([
        loadStudentTodayPath({ authToken: initTokenRef.current }),
        loadStudentReview({ authToken: initTokenRef.current, type: 'summary' }),
        loadStudentReview({ authToken: initTokenRef.current, type: 'history' }),
        loadStudentReview({ authToken: initTokenRef.current, type: 'mistakes' }),
        loadStudentCourses({ authToken: initTokenRef.current }),
        loadStudentLessonAccount({ authToken: initTokenRef.current })
      ]);
      setStudentTodayTasks(Array.isArray(todayPathPayload?.data?.tasks) ? todayPathPayload.data.tasks : []);
      setStudentReviewSummary(summaryPayload?.data || {});
      setStudentReviewHistory(Array.isArray(historyPayload?.data?.items) ? historyPayload.data.items : []);
      setStudentReviewMistakes(Array.isArray(mistakesPayload?.data?.items) ? mistakesPayload.data.items : []);
      setStudentCourses(Array.isArray(coursesPayload?.data?.courses) ? coursesPayload.data.courses : []);
      setStudentLessonAccount(accountPayload?.data || {});
      setStudentVoicePractice(todayPathPayload?.data?.voicePractice || {});
      const studentId = `${accountPayload?.data?.studentId || summaryPayload?.data?.studentId || summaryPayload?.data?.student?.id || ''}`.trim();
      if (studentId) {
        const messagesPayload = await loadChildMessages({
          authToken: initTokenRef.current,
          childId: studentId
        }).catch(() => null);
        setStudentChildMessages(Array.isArray(messagesPayload?.data?.messages) ? messagesPayload.data.messages : []);
      } else {
        setStudentChildMessages([]);
      }
    } catch (error) {
      if (!isNotFoundApiError(error)) {
        setStudentDataMessage(error?.message || '学生数据加载失败');
      }
      throw error;
    } finally {
      setStudentDataLoading(false);
    }
  };

  const submitStudentVoice = async (payload = {}) => {
    return submitStudentVoiceAssess({
      authToken: initTokenRef.current,
      taskId: `${payload.taskId || ''}`.trim(),
      transcript: `${payload.transcript || ''}`.trim(),
      score: Number.isFinite(Number(payload.score)) ? Number(payload.score) : 0
    });
  };

  const submitStudentPath = async (payload = {}) => {
    return submitStudentPathCompletion({
      authToken: initTokenRef.current,
      payload: {
        taskType: 'path_completion',
        title: `${payload.title || ''}`.trim(),
        answer: `${payload.answer || '已完成今日学习路径'}`.trim(),
        score: Number.isFinite(Number(payload.score)) ? Number(payload.score) : 100,
        status: 'done',
        pathId: `${payload.pathId || ''}`.trim(),
        pathTitle: `${payload.pathTitle || payload.title || ''}`.trim(),
        stepIndex: Number.isFinite(Number(payload.stepIndex)) ? Number(payload.stepIndex) : -1,
        studentId: `${payload.studentId || ''}`.trim(),
        source: `${payload.source || 'student_home_path'}`.trim()
      }
    });
  };

  const submitStudentPractice = async (payload = {}) => {
    return submitStudentPracticeReview({
      authToken: initTokenRef.current,
      payload: {
        taskType: payload.taskType || 'practice_task',
        title: `${payload.title || ''}`.trim(),
        answer: `${payload.answer || ''}`.trim(),
        score: Number.isFinite(Number(payload.score)) ? Number(payload.score) : 0,
        status: `${payload.status || 'done'}`.trim(),
        studentId: `${payload.studentId || ''}`.trim(),
        payload: {
          ...(payload.payload || {})
        }
      }
    });
  };

  const downloadTextReport = (content = '', fileName = 'starmate-report.txt', contentType = 'text/plain;charset=utf-8') => {
    const normalizedContent = `${content || ''}`.trim();
    if (!normalizedContent) {
      throw new Error('report content is empty');
    }
    const blob = new Blob([`\ufeff${normalizedContent}`], { type: contentType });
    const link = document.createElement('a');
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = fileName;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(href);
    }, 1200);
  };

  const exportParentReport = async (childId) => {
    const payload = await exportParentChildReport({
      authToken: initTokenRef.current,
      childId,
      institutionId: `${runtimeData?.organizations?.[0]?.institutionId || ''}`.trim()
    });
    const reportData = payload?.data || {};
    downloadTextReport(
      `${reportData.content || ''}`.trim() || JSON.stringify(reportData, null, 2),
      `${reportData.fileName || `starmate-parent-report-${childId || 'unknown'}-${new Date().toISOString().slice(0, 10)}.txt`}`,
      reportData.contentType || 'text/plain;charset=utf-8'
    );
    return reportData;
  };

  const exportProfileReport = async ({ childId = '' } = {}) => {
    if (childId) {
      const payload = await exportParentChildReport({
        authToken: initTokenRef.current,
        childId
      });
      const reportData = payload?.data || {};
      downloadTextReport(
        `${reportData.content || ''}`.trim() || JSON.stringify(reportData, null, 2),
        `${reportData.fileName || `starmate-profile-report-${childId || 'unknown'}-${new Date().toISOString().slice(0, 10)}.txt`}`,
        reportData.contentType || 'text/plain;charset=utf-8'
      );
      return reportData;
    }

    const payload = await exportStudentProfileReport({
      authToken: initTokenRef.current
    });
    const reportData = payload?.data || {};
    downloadTextReport(
      `${reportData.content || ''}`.trim() || JSON.stringify(reportData, null, 2),
      `${reportData.fileName || `starmate-profile-report-${new Date().toISOString().slice(0, 10)}.txt`}`,
      reportData.contentType || 'text/plain;charset=utf-8'
    );
    return reportData;
  };

  const loadTeacherData = async () => {
    setTeacherDataLoading(true);
    setTeacherDataMessage('');
    try {
      const [coursesPayload, studentsPayload, exceptionsPayload] = await Promise.all([
        loadTeacherCourses({ authToken: initTokenRef.current }),
        loadTeacherStudents({ authToken: initTokenRef.current }),
        loadTeacherExceptions({ authToken: initTokenRef.current })
      ]);
      setTeacherCourses(Array.isArray(coursesPayload?.data?.courses) ? coursesPayload.data.courses : runtimeLessons);
      setTeacherStudents(Array.isArray(studentsPayload?.data?.students) ? studentsPayload.data.students : []);
      setTeacherExceptions(Array.isArray(exceptionsPayload?.data?.items) ? exceptionsPayload.data.items : []);
    } catch (error) {
      if (!isNotFoundApiError(error)) {
        setTeacherDataMessage(error?.message || '老师数据加载失败');
      }
    } finally {
      setTeacherDataLoading(false);
    }
  };

  const submitTeacherCourseAttendance = async (courseId, payload = {}) => {
    return submitTeacherAttendanceByCourse({
      authToken: initTokenRef.current,
      courseId,
      payload: {
        status: payload.status || 'attended',
        studentId: payload.studentId || '',
        note: payload.note || '',
        teacherId: payload.teacherId || '',
        sourceLessonId: payload.sourceLessonId || payload.courseId || courseId,
        attendedAt: payload.attendedAt || ''
      }
    });
  };

  const persistTeacherLessonFeedback = async ({
    lessonId = '',
    institutionId = '',
    parentFeedback = ''
  } = {}) => {
    const safeInstitutionId = `${institutionId || runtimeData?.organizations?.[0]?.institutionId || 'inst-star'}`.trim();
    const result = await updateInstitutionLesson({
      authToken: initTokenRef.current,
      role: 'teacher',
      institutionId: safeInstitutionId,
      lessonId,
      patch: {
        parentFeedback
      }
    });
    await loadTeacherData().catch(() => {});
    return result?.data?.lesson || null;
  };

  const assignTeacherExerciseTask = async ({
    studentId = '',
    lessonId = '',
    title = '',
    tasks = [],
    topic = '',
    difficulty = ''
  } = {}) => {
    const result = await assignTeacherExercise({
      authToken: initTokenRef.current,
      studentId,
      payload: {
        lessonId,
        title,
        tasks,
        topic,
        difficulty
      }
    });
    await loadTeacherData().catch(() => {});
    return result?.data?.task || null;
  };

  const submitStudentIntervention = async (studentId, payload = {}, role = 'teacher') => {
    return submitTeacherIntervention({
      authToken: initTokenRef.current,
      studentId,
      role,
      payload: {
        interventionType: payload.interventionType || 'follow',
        action: payload.action || '',
        note: payload.note || '',
        priority: payload.priority || 'high',
        channel: payload.channel || 'teacher'
      }
    });
  };

  const submitTeacherStudentIntervention = async (studentId, payload = {}) => {
    return submitStudentIntervention(studentId, payload, 'teacher');
  };

  const submitFounderStudentIntervention = async (studentId, payload = {}) => {
    return submitStudentIntervention(studentId, payload, activeRole || 'founder');
  };

  const adjustFounderLessonAccountRecord = async (payload = {}) => {
    const result = await adjustFounderLessonAccount({
      authToken: initTokenRef.current,
      payload
    });
    await loadFounderData(founderFilters).catch(() => {});
    return result;
  };

  const persistChildMessage = async ({ childId = '', payload = {} } = {}) => {
    const targetChildId = `${childId || parentSelectedChildId || child?.id || parentSummary?.student?.id || ''}`.trim();
    if (!targetChildId) {
      throw new Error('childId is required');
    }

    const result = await createChildMessage({
      authToken: initTokenRef.current,
      childId: targetChildId,
      payload: {
        ...payload,
        actorRole: payload.actorRole || activeRole || 'parent'
      }
    });

    if (activeRole === 'parent') {
      await loadParentData().catch(() => {});
    } else if (activeRole === 'student') {
      await loadStudentData().catch(() => {});
    }
    return result?.data?.message || null;
  };

  const loadParentData = async () => {
    setParentDataLoading(true);
    setParentDataMessage('');
    try {
      const childrenPayload = await loadParentChildren({ authToken: initTokenRef.current });
      const children = Array.isArray(childrenPayload?.data?.children) ? childrenPayload.data.children : [];
      const defaultChildId = children[0]?.studentId || children[0]?.id || '';
      const selectedExists = children.some((item) => `${item.studentId || item.id || ''}`.trim() === `${parentSelectedChildId || ''}`.trim());
      const nextChildId = selectedExists ? `${parentSelectedChildId || ''}`.trim() : defaultChildId;
      setParentChildren(children);
      setParentSelectedChildId(nextChildId);

      if (!nextChildId) {
        setParentSummary({});
        setParentChildCourses([]);
        setParentChildLessonAccount({});
        setParentChildPayments([]);
        setParentChildMessages([]);
        setParentDataMessage('当前账号未绑定可查看的学员');
        return;
      }

      const [summaryPayload, coursesPayload, accountPayload, paymentsPayload] = await Promise.all([
        loadChildSummary({ authToken: initTokenRef.current, childId: nextChildId }),
        loadChildCourses({ authToken: initTokenRef.current, childId: nextChildId }),
        loadChildLessonAccount({ authToken: initTokenRef.current, childId: nextChildId }),
        loadChildPaymentRecords({ authToken: initTokenRef.current, childId: nextChildId })
      ]);
      setParentSummary(summaryPayload?.data || {});
      setParentChildCourses(Array.isArray(coursesPayload?.data?.courses) ? coursesPayload.data.courses : []);
      setParentChildLessonAccount(accountPayload?.data || {});
      setParentChildPayments(Array.isArray(paymentsPayload?.data?.records) ? paymentsPayload.data.records : []);
      const messagesPayload = await loadChildMessages({
        authToken: initTokenRef.current,
        childId: nextChildId
      }).catch(() => null);
      setParentChildMessages(Array.isArray(messagesPayload?.data?.messages) ? messagesPayload.data.messages : []);
    } catch (error) {
      if (!isNotFoundApiError(error)) {
        setParentDataMessage(error?.message || '家长数据加载失败');
      }
      throw error;
    } finally {
      setParentDataLoading(false);
    }
  };

  const loadFounderData = async (inputFilters = founderFilters) => {
    setFounderDataLoading(true);
    setFounderDataMessage('');
    try {
      const normalizedFilters = {
        courseStatus: `${inputFilters?.courseStatus || ''}`.trim(),
        leadStatus: `${inputFilters?.leadStatus || ''}`.trim(),
        paymentStatus: `${inputFilters?.paymentStatus || ''}`.trim(),
        paymentStudentId: `${inputFilters?.paymentStudentId || ''}`.trim(),
        paymentCourseId: `${inputFilters?.paymentCourseId || ''}`.trim(),
        paymentStartAt: `${inputFilters?.paymentStartAt || ''}`.trim(),
        paymentEndAt: `${inputFilters?.paymentEndAt || ''}`.trim(),
        startAt: `${inputFilters?.startAt || ''}`.trim(),
        endAt: `${inputFilters?.endAt || ''}`.trim()
      };
      const [cockpitPayload, leadsPayload, coursesPayload, paymentPayload, lessonAccountPayload, attendancePayload] = await Promise.all([
        loadFounderCockpit({ authToken: initTokenRef.current, filters: normalizedFilters }),
        loadFounderLeads({ authToken: initTokenRef.current, filters: { status: normalizedFilters.leadStatus } }),
        loadFounderCourses({ authToken: initTokenRef.current, filters: { status: normalizedFilters.courseStatus } }),
        loadFounderPaymentRecords({
          authToken: initTokenRef.current,
          filters: {
            status: normalizedFilters.paymentStatus,
            studentId: normalizedFilters.paymentStudentId,
            courseId: normalizedFilters.paymentCourseId,
            startAt: normalizedFilters.paymentStartAt,
            endAt: normalizedFilters.paymentEndAt
          }
        }),
        loadFounderLessonAccounts({ authToken: initTokenRef.current }),
        loadFounderAttendanceRecords({ authToken: initTokenRef.current, filters: { startAt: normalizedFilters.startAt, endAt: normalizedFilters.endAt } })
      ]);
      setFounderCockpit(cockpitPayload?.data || {});
      setFounderLeads(Array.isArray(leadsPayload?.data?.items) ? leadsPayload.data.items : []);
      setFounderCourses(Array.isArray(coursesPayload?.data?.courses) ? coursesPayload.data.courses : []);
      setFounderPaymentRecords(Array.isArray(paymentPayload?.data?.records) ? paymentPayload.data.records : []);
      setFounderLessonAccounts(Array.isArray(lessonAccountPayload?.data?.items) ? lessonAccountPayload.data.items : []);
      setFounderAttendanceRecords(Array.isArray(attendancePayload?.data?.items) ? attendancePayload.data.items : []);
    } catch (error) {
      if (!isNotFoundApiError(error)) {
        setFounderDataMessage(error?.message || '创始人数据加载失败');
      }
    } finally {
      setFounderDataLoading(false);
    }
  };

  const takeoverLead = async (leadId) => takeoverFounderLead({
    authToken: initTokenRef.current,
    leadId
  });

  const convertLead = async (leadId, payload) => convertFounderLead({
    authToken: initTokenRef.current,
    leadId,
    payload
  });

  const createFounderCourseRecord = async (payload = {}) => {
    const result = await createFounderCourse({
      authToken: initTokenRef.current,
      payload: {
        ...payload,
        institutionId: payload.institutionId || runtimeData?.organizations?.[0]?.id || runtimeData?.organizations?.[0]?.institutionId || ''
      }
    });
    await Promise.all([
      loadFounderData(founderFilters).catch(() => {}),
      loadPublicCourses().catch(() => {})
    ]);
    return result;
  };

  const updateFounderCourseRecord = async (payload = {}) => {
    const result = await updateFounderCourse({
      authToken: initTokenRef.current,
      payload
    });
    await Promise.all([
      loadFounderData(founderFilters).catch(() => {}),
      loadPublicCourses().catch(() => {})
    ]);
    return result;
  };

  const loadRoleData = async () => {
    if (!isAuthenticated || !isApiMode()) {
      return;
    }
    if (activeRole === 'student') {
      await loadStudentData();
      return;
    }
    if (activeRole === 'teacher') {
      await loadTeacherData();
      return;
    }
    if (activeRole === 'parent') {
      await loadParentData();
      return;
    }
    if (activeRole === 'founder') {
      await loadFounderData(founderFilters);
      return;
    }
  };

  const handleParentChildSelect = async (childId) => {
    if (!childId) {
      setParentSelectedChildId('');
      return;
    }
      setParentSelectedChildId(childId);
      setParentDataLoading(true);
      setParentDataMessage('');
      try {
        const [summaryPayload, coursesPayload, accountPayload, paymentsPayload] = await Promise.all([
          loadChildSummary({ authToken: initTokenRef.current, childId }),
          loadChildCourses({ authToken: initTokenRef.current, childId }),
          loadChildLessonAccount({ authToken: initTokenRef.current, childId }),
          loadChildPaymentRecords({ authToken: initTokenRef.current, childId })
        ]);
        setParentSummary(summaryPayload?.data || {});
        setParentChildCourses(Array.isArray(coursesPayload?.data?.courses) ? coursesPayload.data.courses : []);
        setParentChildLessonAccount(accountPayload?.data || {});
        setParentChildPayments(Array.isArray(paymentsPayload?.data?.records) ? paymentsPayload.data.records : []);
        const messagesPayload = await loadChildMessages({
          authToken: initTokenRef.current,
          childId
        }).catch(() => null);
        setParentChildMessages(Array.isArray(messagesPayload?.data?.messages) ? messagesPayload.data.messages : []);
      } catch (error) {
        setParentDataMessage(error?.message || '切换孩子失败');
      } finally {
      setParentDataLoading(false);
    }
  };

  useEffect(() => {
    loadPublicCourses().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isApiMode()) {
      return;
    }
    loadRoleData().catch(() => {});
  }, [activeRole, authToken, isAuthenticated, founderFilters]);


  const applyOrgAction = async (org, action, localPatch = {}) => {
    const organization = {
      ...org,
      ...localPatch
    };
    const organizationId = organization.id || organization.name;
    if (!organizationId) {
      return;
    }

    const onFailureFallback = () => {
      setRuntimeData((prev) => ({
        ...prev,
        organizations: (prev.organizations || []).map((item) =>
          (item.id || item.name) === organizationId ? { ...item, ...localPatch } : item
        )
      }));
    };

    const token = initTokenRef.current;
    setPlatformActionMessage('');
    setPlatformActionOrgId(organizationId);

    try {
      if (!isApiMode() || !isApiDataSource()) {
        setRuntimeData((prev) => ({
          ...prev,
          organizations: (prev.organizations || []).map((item) =>
            (item.id || item.name) === organizationId ? { ...item, ...localPatch } : item
          )
        }));
        return;
      }

      const payload = buildInstitutionPatchPayload({
        org: organization,
        action
      });

      const result = await patchInstitution({
        ...payload,
        authToken: trimEnv(token)
      });

      const updated = normalizeOrgForUi(
        result?.data?.after ||
          (result?.data?.institution) ||
          (result?.data?.updated) ||
          {}
      );

      if (updated?.id) {
        setRuntimeData((prev) => ({
          ...prev,
          organizations: (prev.organizations || []).map((item) =>
            (item.id || item.name) === updated.id ? updated : item
          )
        }));
      } else {
        const refreshed = await loadRuntimeData({
          role: activeRole,
          authToken: token
        });
        setRuntimeData({
          ...refreshed
        });
      }
    } catch (error) {
      onFailureFallback();
      setPlatformActionMessage(error?.message || '机构操作失败，请稍后再试');
    } finally {
      setPlatformActionOrgId('');
    }
  };

  const platformAdminPage = (
    <PlatformAdmin
      organizations={platformOrgs}
      orgActionsByStatus={runtimeData.orgActionsByStatus || FALLBACK_DATA.orgActionsByStatus}
      orgStatusDefaults={runtimeData.orgStatusDefaults || FALLBACK_DATA.orgStatusDefaults}
      onApplyOrgAction={activeRole === 'platform' ? applyOrgAction : null}
      onAction={appendOperationLog}
      onRefresh={() => refreshPlatformOrgs().catch(() => {})}
      onCreateOrg={activeRole === 'platform' ? async ({ name }) => {
        const futureTrialEndsAt = new Date(Date.now() + (PLATFORM_TRIAL_ORG_LIMITS.trialDays * 24 * 60 * 60 * 1000))
          .toISOString()
          .slice(0, 10);
        setPlatformActionOrgId('platform:create');
        setPlatformActionMessage('');
        try {
          await createPlatformInstitution({
            authToken: initTokenRef.current,
            payload: {
              name,
              planCode: 'trial',
              planMode: 'monthly',
              status: 'trial',
              studentLimit: PLATFORM_TRIAL_ORG_LIMITS.students,
              teacherLimit: PLATFORM_TRIAL_ORG_LIMITS.teachers,
              aiLimitMonthly: PLATFORM_TRIAL_ORG_LIMITS.aiLimit,
              trialEndsAt: futureTrialEndsAt
            }
          });
          await refreshPlatformOrgs();
          setPlatformActionMessage(`已创建机构【${name}】并刷新列表`);
        } catch (error) {
          setPlatformActionMessage(error?.message || '创建机构失败');
          throw error;
        } finally {
          setPlatformActionOrgId('');
        }
      } : null}
      actionBusyOrgId={platformActionOrgId}
      statusMessage={platformActionMessage}
    />
  );

  const refreshPlatformOrgs = async () => {
    if (!isApiMode()) {
      return;
    }

    try {
      const listPayload = await loadPlatformInstitutions({
        authToken: initTokenRef.current
      });
      const list = normalizeOrganizationsForUi(listPayload?.data?.institutions || []);
      setRuntimeData((prev) => ({
        ...prev,
        organizations: list
      }));
    } catch {
      // 忽略刷新异常，继续使用当前 runtimeData
    }
  };

  const normalizeAuditFilters = (input = {}) => {
    const merged = {
      ...platformAuditFilters,
      ...input
    };
    return {
      institutionId: `${merged.institutionId || ''}`.trim(),
      action: `${merged.action || ''}`.trim(),
      decision: `${merged.decision || ''}`.trim(),
      userId: `${merged.userId || ''}`.trim(),
      clientIp: `${merged.clientIp || ''}`.trim(),
      startAt: `${merged.startAt || ''}`.trim(),
      endAt: `${merged.endAt || ''}`.trim(),
      role: `${merged.role || ''}`.trim(),
      limit: Number.isFinite(Number(merged.limit)) ? Number(merged.limit) : 20,
      offset: Number.isFinite(Number(merged.offset)) ? Number(merged.offset) : 0
    };
  };

  const normalizeAiUsageFilters = (input = {}) => {
    const merged = {
      ...platformAiUsageFilters,
      ...input
    };

    const daysValue = Number(merged.days);
    return {
      institutionId: `${merged.institutionId || ''}`.trim(),
      days: Number.isFinite(daysValue) && daysValue > 0 ? daysValue : 30,
      includeUsers: merged.includeUsers === true || `${merged.includeUsers}` === 'true',
      startAt: `${merged.startAt || ''}`.trim(),
      endAt: `${merged.endAt || ''}`.trim(),
      limit: Number.isFinite(Number(merged.limit)) ? Number(merged.limit) : 50,
      userLimit: Number.isFinite(Number(merged.userLimit)) ? Number(merged.userLimit) : 20
    };
  };

  const loadPlatformAIAudit = async (inputFilters = {}, options = {}) => {
    if (!isApiMode()) {
      return null;
    }

    const normalizedFilters = normalizeAuditFilters(inputFilters);
    const append = options.append === true;
    setPlatformAuditLoading(true);
    setPlatformAuditMessage('');
    try {
      const response = await loadAIAuditLogs({
        authToken: initTokenRef.current,
        role: 'platform',
        filters: normalizedFilters
      });
      const payload = response?.data || {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      const nextOffset = Number.isFinite(Number(payload.nextOffset)) ? Number(payload.nextOffset) : 0;
      const nextLimit = Number.isFinite(Number(payload.limit)) ? Number(payload.limit) : normalizedFilters.limit;
      const nextOffsetAt = Number.isFinite(Number(payload.offset)) ? Number(payload.offset) : normalizedFilters.offset;
      const nextTotal = Number.isFinite(Number(payload.total)) ? Number(payload.total) : 0;

      setPlatformAuditData((prev) => ({
        total: nextTotal,
        limit: nextLimit,
        offset: nextOffsetAt,
        nextOffset,
        sourceSummary: response?.data?.sourceSummary || null,
        items: append ? [...(prev.items || []), ...items] : items
      }));
      setPlatformAuditFilters((prev) => ({
        ...prev,
        ...normalizedFilters,
        limit: nextLimit,
        offset: nextOffsetAt
      }));
    } catch (error) {
      setPlatformAuditMessage(error?.message || 'AI 审计日志加载失败');
      setPlatformAuditData((prev) => ({
        ...prev,
        sourceSummary: null,
        nextOffset: 0
      }));
    } finally {
      setPlatformAuditLoading(false);
    }

    return null;
  };

  const loadPlatformAIUsage = async (inputFilters = {}) => {
    if (!isApiMode()) {
      return null;
    }

    const normalizedFilters = normalizeAiUsageFilters(inputFilters);
    setPlatformAiUsageLoading(true);
    setPlatformAiUsageMessage('');
    try {
      const response = await loadAiUsage({
        authToken: initTokenRef.current,
        role: 'platform',
        filters: normalizedFilters
      });

      const payload = response?.data || {};
      const usageRows = Array.isArray(payload.items) ? payload.items : [];
      const topUsersRows = Array.isArray(payload.topUsers) ? payload.topUsers : [];
      const window = payload.window || {};

      setPlatformAiUsageData({
        window: {
          days: Number(window.days || normalizedFilters.days),
          startAt: window.startAt || normalizedFilters.startAt || '',
          endAt: window.endAt || normalizedFilters.endAt || ''
        },
        institutionId: payload.institutionId || normalizedFilters.institutionId,
        totalInstitutions: Number.isFinite(Number(payload.totalInstitutions)) ? Number(payload.totalInstitutions) : usageRows.length,
        limit: Number.isFinite(Number(payload.limit)) ? Number(payload.limit) : normalizedFilters.limit,
        items: usageRows,
        topUsers: topUsersRows,
        summary: payload.summary || null,
        sourceSummary: payload.sourceSummary || null
      });

      setPlatformAiUsageFilters((prev) => ({
        ...prev,
        ...normalizedFilters
      }));
      if (usageRows.length === 0) {
        setPlatformAiUsageMessage('本次查询未返回 AI 用量数据');
      }
    } catch (error) {
      setPlatformAiUsageMessage(error?.message || 'AI 用量加载失败');
      setPlatformAiUsageData((prev) => ({
        ...prev,
        items: [],
        topUsers: [],
        sourceSummary: null
      }));
    } finally {
      setPlatformAiUsageLoading(false);
    }

    return null;
  };

  const exportPlatformAIAudit = async () => {
    try {
      const payload = isApiMode()
        ? (await exportPlatformAIAuditReport({
            authToken: initTokenRef.current,
            role: 'platform',
            filters: normalizeAuditFilters(platformAuditFilters)
          }))?.data || {}
        : null;
      const reportData = payload || {};
      const content = `${reportData.content || ''}`.trim();
  if (!content) {
        setPlatformAuditMessage('暂无可导出的审计报表');
        return;
      }

      downloadTextReport(
        content,
        `${reportData.fileName || `starmate-ai-audit-${new Date().toISOString().slice(0, 10)}.csv`}`,
        reportData.contentType || 'text/csv;charset=utf-8'
      );
    } catch (error) {
      setPlatformAuditMessage(error?.message || '审计导出失败');
    }
  };

  const updatePlatformAuditFilters = (patch = {}) => {
    const nextFilters = normalizeAuditFilters({
      ...platformAuditFilters,
      ...patch,
      offset: patch.offset === undefined ? 0 : patch.offset
    });
    setPlatformAuditFilters(nextFilters);

    if (!isApiMode()) {
      return;
    }
    loadPlatformAIAudit(nextFilters).catch(() => {});
  };

  const updatePlatformAiUsageFilters = (patch = {}) => {
    const nextFilters = normalizeAiUsageFilters({
      ...platformAiUsageFilters,
      ...patch
    });
    if (!nextFilters.institutionId) {
      nextFilters.includeUsers = false;
      nextFilters.userLimit = 20;
    }
    setPlatformAiUsageFilters(nextFilters);

    if (!isApiMode()) {
      return;
    }
    loadPlatformAIUsage(nextFilters).catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated || !isApiMode()) {
      return;
    }

    if (activeRole === 'platform') {
      refreshPlatformOrgs().catch(() => {});
    }
  }, [activeRole, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isApiMode()) {
      return;
    }

    if (activeRole === 'platform' && activePage === 'profile') {
      loadPlatformAIAudit(platformAuditFilters).catch(() => {});
    }
  }, [activeRole, activePage, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isApiMode()) {
      return;
    }

    if (activeRole === 'platform' && activePage === 'profile') {
      loadPlatformAIUsage(platformAiUsageFilters).catch(() => {});
    }
  }, [activeRole, activePage, isAuthenticated]);

  useEffect(() => {
    const current = pageConfig[0]?.id;
    if (current && !pageConfig.some((item) => item.id === activePage)) {
      setActivePage(current);
    }
  }, [activeRole, pageConfig, activePage]);

  const warnDeadlineDays = 7;
  const warningOrganizations = useMemo(() => {
    return (platformOrgs || []).filter((org) => {
      const statusCritical = org.status === ORG_STATUS.expired || org.status === ORG_STATUS.trial;
      if (!statusCritical) {
        return false;
      }
      const left = daysToDate(org.expires);
      return !Number.isFinite(left) || left <= warnDeadlineDays;
    });
  }, [platformOrgs]);

  const platformOverviewPage = (
    <PlatformOverview
      platformSummary={runtimeData.platformSummary || FALLBACK_DATA.platformSummary}
      organizations={platformOrgs}
      warningOrganizations={platformWarningsVisible ? warningOrganizations : []}
      onExportReport={async () => {
        try {
          const payload = isApiMode()
            ? (await exportPlatformInstitutionsReport({
                authToken: initTokenRef.current
              }))?.data || {}
            : null;
          const content = `${payload.content || ''}`.trim();
          if (!content) {
            setPlatformActionMessage('当前没有可导出的机构数据');
            return;
          }

          downloadTextReport(
            content,
            `${payload.fileName || `starmate-platform-report-${new Date().toISOString().slice(0, 10)}.csv`}`,
            payload.contentType || 'text/csv;charset=utf-8'
          );
        } catch (error) {
          setPlatformActionMessage(error?.message || '运营周报导出失败');
        }
      }}
      onAcknowledgeWarnings={async () => {
        try {
          await refreshPlatformOrgs();
          setPlatformWarningsVisible(true);
          appendOperationLog('platform', '检查今日异常机构');
        } catch (error) {
          setPlatformActionMessage(error?.message || '异常检查失败');
        }
      }}
    />
  );

  const platformAiPage = (
      <PlatformAiPage
        organizations={platformOrgs}
        aiUsageData={platformAiUsageData}
        aiUsageLoading={platformAiUsageLoading}
        aiUsageMessage={platformAiUsageMessage}
        aiSourceLabel={runtimeData.appMeta?.modeLabel || APP_COPY.simulatedText}
        aiProvider={runtimeData.appMeta?.aiProvider || 'mock'}
        aiBaseUrl={runtimeData.appMeta?.aiBaseUrl || ''}
        aiModel={runtimeData.appMeta?.aiModel || 'mock'}
        aiUsageFilters={platformAiUsageFilters}
        onAiUsageFiltersChange={updatePlatformAiUsageFilters}
        onRetryAiUsage={() => {
          loadPlatformAIUsage(platformAiUsageFilters).catch(() => {});
        }}
        onExportAiUsage={async () => {
          try {
            const payload = isApiMode()
              ? (await exportPlatformAiUsageReport({
                  authToken: initTokenRef.current,
                  role: 'platform',
                  filters: normalizeAiUsageFilters(platformAiUsageFilters)
                }))?.data || {}
              : (platformAiUsageData || {});
            const content = `${payload.content || ''}`.trim();
            if (!content) {
              setPlatformAiUsageMessage('暂无可导出的 AI 用量报表');
              return;
            }

            downloadTextReport(
              content,
              `${payload.fileName || `starmate-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`}`,
              payload.contentType || 'text/csv;charset=utf-8'
            );
          } catch (error) {
            setPlatformAiUsageMessage(error?.message || 'AI 用量导出失败');
          }
        }}
        auditData={platformAuditData}
        auditLoading={platformAuditLoading}
        auditMessage={platformAuditMessage}
        auditFilters={platformAuditFilters}
        onAuditFiltersChange={updatePlatformAuditFilters}
        onRetryAudit={() => {
          loadPlatformAIAudit(platformAuditFilters).catch(() => {});
        }}
        onExportAudit={exportPlatformAIAudit}
        onLoadMoreAudit={() => {
          const nextOffset = Number(platformAuditData.nextOffset || 0);
          if (!nextOffset) {
            return;
          }
        loadPlatformAIAudit({
          ...platformAuditFilters,
          offset: nextOffset
        }, { append: true }).catch(() => {});
      }}
      canLoadMoreAudit={Number(platformAuditData.nextOffset || 0) > 0}
    />
  );

  const uploadCultureWall = async ({ kind, file, onProgress }) => {
    if (!canManageCultureWallData) {
      return null;
    }

    const payload = await uploadCultureWallAsset({
      authToken: initTokenRef.current,
      role: activeRole,
      kind,
      file,
      uploader: '当前管理员',
      onProgress
    });

    const nextWall = payload?.data?.cultureWall;
    if (nextWall) {
      setRuntimeData((prev) => ({
        ...prev,
        cultureWall: nextWall
      }));
    }

    return nextWall;
  };

  const loadCultureWallData = async () => {
    if (!canManageCultureWallData) {
      return cultureWall;
    }

    const payload = await loadCultureWallAssets({
      authToken: initTokenRef.current,
      role: activeRole
    });
    const nextWall = payload?.data?.cultureWall;
    if (nextWall) {
      setRuntimeData((prev) => ({
        ...prev,
        cultureWall: nextWall
      }));
    }
    return nextWall;
  };

  const invokeAIAgent = async ({ action, payload = {}, institutionId = '' }) => {
    return runAIAgent({
      authToken: initTokenRef.current,
      role: activeRole,
      action,
      institutionId,
      payload
    });
  };

  const handleAdminLogin = async (credentials = {}) => {
    setAuthBusy(true);
    setAuthMessage('');

    try {
      const response = await loginWithCredentials({
        role: credentials?.role || initRoleFallback,
        username: credentials?.username,
        password: credentials?.password
      });

      if (!response?.success) {
        throw new Error(response?.error || '登录失败');
      }

      const token = `${response?.data?.token || ''}`.trim();
      if (!token) {
        throw new Error('登录响应缺少 token');
      }

      const loginUser = response?.data?.user || {};
      const loginRole = normalizeRoleInput(loginUser.role || credentials?.role || initRoleFallback);
      if (!loginRole) {
        throw new Error('登录角色返回异常');
      }

      const nextUser = {
        ...loginUser,
        role: loginRole
      };

      saveSessionToStorage(token, nextUser);
      initTokenRef.current = token;
      setAuthToken(token);
      setAuthUser(nextUser);
      setActiveRole(loginRole);
      setIsAuthenticated(true);
      setIsAuthReady(true);
      setActivePage('home');
      setPageContext({});
      setActiveStage('age_7_10');
      window.history.replaceState({}, '', '/admin');
      setAuthMessage('');
    } catch (error) {
      clearSessionFromStorage();
      setAuthUser(null);
      setAuthToken('');
      initTokenRef.current = '';
      setIsAuthenticated(false);
      setAuthMessage(error?.message || '登录失败');
      throw error;
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminLogout = () => {
    clearSessionFromStorage();
    setAuthToken('');
    setAuthUser(null);
    initTokenRef.current = '';
    setIsAuthenticated(requiresAuth ? false : true);
    setIsAuthReady(true);
    setActiveRole(initRoleFallback);
    setActivePage('home');
    setPageContext({});
    setRuntimeData(FALLBACK_DATA);
  };

  if (requiresAuth && !isAuthReady) {
    return (
      <main className="admin-login-screen">
        <section className="admin-login-card">
          <h1>正在验证登录信息...</h1>
          <p>请稍候，正在校验 /admin 访问权限</p>
        </section>
      </main>
    );
  }

  if (requiresAuth && !isAuthenticated) {
    return (
      <AdminLoginPage
        defaultRole={initRoleFromSession || initRoleFromQuery || initRoleFallback}
        forceAccountMode={requiresAuth}
        busy={authBusy}
        errorMessage={authMessage}
        onSubmit={handleAdminLogin}
      />
    );
  }

  const pageScreens = {
    home:
      activeRole === 'platform'
        ? platformOverviewPage
        : activeRole === 'founder'
        ? (
          <FounderDashboard
            cockpit={founderCockpit}
            leads={founderLeads}
            courses={founderCourses}
            paymentRecords={founderPaymentRecords}
            lessonAccounts={founderLessonAccounts}
            attendanceRecords={founderAttendanceRecords}
            filters={founderFilters}
            onFiltersChange={(patch) => {
              setFounderFilters((prev) => ({
                ...prev,
                ...patch
              }));
            }}
            onRefresh={() => loadFounderData(founderFilters).catch(() => {})}
            loading={founderDataLoading}
            message={founderDataMessage}
            onAction={appendOperationLog}
            onTakeoverLead={takeoverLead}
            onConvertLead={convertLead}
            onAdjustLessonAccount={adjustFounderLessonAccountRecord}
          />
        )
        : activeRole === 'teacher'
        ? (
          <TeacherWorkspace
            lessons={lessons}
            students={teacherStudents}
            exceptions={teacherExceptions}
            onRunAgent={invokeAIAgent}
            onSubmitAttendance={submitTeacherCourseAttendance}
            onPersistLessonFeedback={persistTeacherLessonFeedback}
            onAssignExercise={assignTeacherExerciseTask}
            onSubmitIntervention={submitTeacherStudentIntervention}
            onRefresh={() => loadTeacherData().catch(() => {})}
            loading={teacherDataLoading}
            message={teacherDataMessage}
            onAction={appendOperationLog}
          />
        )
        : activeRole === 'parent'
        ? (
          <ParentView
            children={parentChildren}
            childSummary={parentSummary}
            childCourses={parentChildCourses}
            childLessonAccount={parentChildLessonAccount}
            childPaymentRecords={parentChildPayments}
            selectedChildId={selectedParentChildId}
            onChildSelect={handleParentChildSelect}
            onExportReport={exportParentReport}
            onRefresh={() => loadParentData().catch(() => {})}
            loading={parentDataLoading}
            message={parentDataMessage}
            onAction={appendOperationLog}
          />
        )
        : activeRole === 'student'
        ? (
          <StudentView
            todayPath={studentTodayTasks}
            reviewSummary={studentReviewSummary}
            reviewHistory={studentReviewHistory}
            reviewMistakes={studentReviewMistakes}
            courses={studentCourses}
            lessonAccount={studentLessonAccount}
            voicePractice={studentVoicePractice}
            loading={studentDataLoading}
            message={studentDataMessage}
            onRefresh={() => loadStudentData().catch(() => {})}
            onRefreshCourses={() => loadStudentData().catch(() => {})}
            onRefreshPractice={() => loadStudentData().catch(() => {})}
            onSubmitVoiceAssess={submitStudentVoice}
            publicCourses={publicCourses}
            publicCoursesLoading={publicCoursesLoading}
            publicLeadSubmitting={publicLeadSubmitting}
            onSubmitPublicLead={submitPublicLead}
            onSubmitTrialBooking={submitTrialBooking}
            onRefreshPublicCourses={loadPublicCourses}
            admissionsMedia={admissionsMedia}
            onSubmitPathCompletion={activeRole === 'student' ? submitStudentPath : null}
            onSubmitPracticeReview={activeRole === 'student' ? submitStudentPractice : null}
            onNavigatePage={switchPage}
            onAction={appendOperationLog}
          />
        )
        : (
          <HomePage
            lessons={lessons}
            child={child}
            report={report}
            cultureWall={cultureWall}
            admissionsMedia={admissionsMedia}
            activeStageMeta={currentStage}
            roleLabel={currentRole?.label || '学生'}
            currentStage={currentStage}
            canEditCultureWall={['founder', 'platform'].includes(activeRole)}
            onNavigatePage={switchPage}
            publicCourses={publicCourses}
            publicCoursesLoading={publicCoursesLoading}
            publicLeadSubmitting={publicLeadSubmitting}
            publicLeadReplyLoading={publicLeadReplyLoading}
            onSubmitPublicLead={submitPublicLead}
            onSubmitTrialBooking={submitTrialBooking}
            onSendLeadAiReply={sendPublicLeadReply}
            onSubmitIntervention={['founder', 'platform'].includes(activeRole) ? submitFounderStudentIntervention : null}
            onRefreshPublicCourses={loadPublicCourses}
            onRefreshStudentCourses={
              activeRole === 'student'
                ? () => loadStudentData().catch(() => {})
                : activeRole === 'teacher'
                  ? () => loadTeacherData().catch(() => {})
                  : activeRole === 'founder'
                    ? () => loadFounderData(founderFilters).catch(() => {})
                    : activeRole === 'parent'
                      ? () => loadParentData().catch(() => {})
                      : null
            }
            onAction={appendOperationLog}
            onUploadCultureAsset={canManageCultureWallData ? uploadCultureWall : null}
            onRefreshCultureWall={canManageCultureWallData ? loadCultureWallData : null}
            onRunAIAgent={activeRole === 'founder' ? invokeAIAgent : null}
          />
        ),
    courses:
      activeRole === 'platform'
        ? platformAdminPage
        : (
          <CoursesPage
            lessons={lessons}
            report={report}
            activeStageMeta={currentStage}
            activeRole={activeRole}
            studentCourses={activeRole === 'student'
              ? studentCourses
                : activeRole === 'parent'
                  ? parentChildCourses
                  : lessons}
            studentReviewSummary={studentReviewSummary}
            studentReviewHistory={studentReviewHistory}
            studentLessonAccount={studentLessonAccount}
            selectedCourseId={pageContext.selectedCourseId || ''}
            selectedChildId={pageContext.selectedChildId || ''}
            onNavigatePage={switchPage}
            onRunAIAgent={activeRole !== 'platform' ? invokeAIAgent : null}
            onSubmitPathCompletion={activeRole === 'student' ? submitStudentPath : null}
            onCreateCourse={activeRole === 'founder' ? createFounderCourseRecord : null}
            onUpdateCourse={activeRole === 'founder' ? updateFounderCourseRecord : null}
            onRefreshCourses={
              activeRole === 'student'
                ? () => loadStudentData().catch(() => {})
                : activeRole === 'teacher'
                  ? () => loadTeacherData().catch(() => {})
                  : activeRole === 'founder'
                    ? () => loadFounderData(founderFilters).catch(() => {})
                    : activeRole === 'parent'
                      ? () => loadParentData().catch(() => {})
                      : null
            }
            onAction={appendOperationLog}
          />
        ),
    practice:
      activeRole === 'platform'
        ? (
          <PlatformPlansPage
            organizations={runtimeData.organizations || FALLBACK_DATA.organizations}
            orgStatusDefaults={runtimeData.orgStatusDefaults || FALLBACK_DATA.orgStatusDefaults}
            orgActionsByStatus={runtimeData.orgActionsByStatus || FALLBACK_DATA.orgActionsByStatus}
            platformSummary={runtimeData.platformSummary || FALLBACK_DATA.platformSummary}
          />
        )
        : (
          <PracticePage
            activeRole={activeRole}
            initialPracticeModuleId={pageContext.practiceModuleId || ''}
            studentTodayTasks={studentTodayTasks}
            studentReviewHistory={studentReviewHistory}
            studentReviewMistakes={studentReviewMistakes}
            report={report}
            onRunAIAgent={activeRole !== 'platform' ? invokeAIAgent : null}
            onResetChallenge={activeRole !== 'platform' ? invokeAIAgent : null}
            onSubmitPracticeReview={activeRole === 'student' ? submitStudentPractice : null}
            onSubmitVoiceAssess={activeRole === 'student' ? submitStudentVoice : null}
            onAction={appendOperationLog}
          />
        ),
    profile:
      activeRole === 'platform'
        ? platformAiPage
        : (
            <ProfilePage
              child={child}
              report={report}
              cultureWall={cultureWall}
              childMessages={activeRole === 'parent' ? parentChildMessages : studentChildMessages}
              lessonAccount={activeRole === 'parent' ? parentChildLessonAccount : studentLessonAccount}
              lessonAccountSourceLabel={activeRole === 'parent' ? '家长课时账户接口' : '学生课时账户接口'}
              childCourses={activeRole === 'parent' ? parentChildCourses : studentCourses}
              onRefresh={activeRole === 'parent' ? loadParentData : activeRole === 'student' ? loadStudentData : null}
              onExportReport={activeRole === 'parent'
                ? () => exportProfileReport({ childId: selectedParentChildId || child?.id || parentSummary?.student?.id || '' })
                : activeRole === 'student'
                  ? () => exportProfileReport()
                  : null}
              onRunAIAgent={invokeAIAgent}
              onCreateChildMessage={persistChildMessage}
              onRefreshCultureWall={canManageCultureWallData ? loadCultureWallData : null}
              onAction={appendOperationLog}
              onNavigatePage={switchPage}
            />
        ),
    'culture-wall': (
      <CultureWallPage
        cultureWall={cultureWall}
        canEditCultureWall={canManageCultureWallData}
        onRefreshCultureWall={canManageCultureWallData ? loadCultureWallData : null}
        onUploadCultureAsset={canManageCultureWallData ? uploadCultureWall : null}
        onAction={appendOperationLog}
      />
    ),
    agents:
      activeRole === 'platform'
        ? (
          <AgentCenter
            aiAgents={runtimeData.aiAgents || FALLBACK_DATA.aiAgents}
            onRunAIAgent={activeRole === 'platform' ? invokeAIAgent : null}
            activeRole={activeRole}
            sourcePage={currentPage?.id || activePage || 'agents'}
            sourcePageLabel={currentPage?.label || '智能体中心'}
            aiSourceLabel={runtimeData.appMeta?.modeLabel || APP_COPY.simulatedText}
            aiProvider={runtimeData.appMeta?.aiProvider || 'mock'}
            aiBaseUrl={runtimeData.appMeta?.aiBaseUrl || ''}
            aiModel={runtimeData.appMeta?.aiModel || 'mock'}
          />
        )
        : (
          <AgentCenter
            aiAgents={runtimeData.aiAgents || FALLBACK_DATA.aiAgents}
            onRunAIAgent={activeRole === 'founder' || activeRole === 'teacher' ? invokeAIAgent : null}
            activeRole={activeRole}
            sourcePage={currentPage?.id || activePage || 'agents'}
            sourcePageLabel={currentPage?.label || '智能体中心'}
            aiSourceLabel={runtimeData.appMeta?.modeLabel || APP_COPY.simulatedText}
            aiProvider={runtimeData.appMeta?.aiProvider || 'mock'}
            aiBaseUrl={runtimeData.appMeta?.aiBaseUrl || ''}
            aiModel={runtimeData.appMeta?.aiModel || 'mock'}
          />
        )
  };

  const activeScreen = pageScreens[activePage] || pageScreens[pageConfig[0]?.id] || null;
  const sidebarNode = (
    <AppSidebar
      pageConfig={pageConfig}
      activePage={activePage}
      onNavigatePage={switchPage}
      child={child}
      currentStage={currentStage}
      activeRole={activeRole}
      currentPage={currentPage}
      requiresAuth={requiresAuth}
      authUser={authUser}
      authGuardedRole={authGuardedRole}
      getRoleLabel={getRoleLabel}
      currentRole={currentRole}
      roleTabs={roleTabs}
      onSwitchRole={switchRole}
      onLogout={handleAdminLogout}
      appCopy={appCopy}
      showAdminLink={activeRole === 'platform' || requiresAuth}
    />
  );
  const topbarNode = currentPage.id !== 'home' ? (
    <AppTopbar
      currentPage={currentPage}
      shellTitle={shellTitle}
      actionCount={actionCount}
      activeRole={activeRole}
      ageGroups={AGE_GROUPS}
      activeStage={activeStage}
      onSwitchStage={setActiveStage}
    />
  ) : null;
  const homeStripNode = currentPage.id === 'home' ? (
    <section className="home-stage-strip">
      <div className="home-stage-strip-brand">
        <span>{shellTitle}</span>
      </div>
      <div className="role-tabs home-stage-tabs-compact">
        {AGE_GROUPS.map((tab) => (
          <button
            className={activeStage === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => setActiveStage(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <AppShell sidebar={sidebarNode} topbar={topbarNode} homeStrip={homeStripNode}>
      {actionToast ? (
        <section className="action-toast">
          <span>✅ {actionToast}</span>
        </section>
      ) : null}

      {activeScreen}
      {activeRole === 'platform' && operationLogs.length > 0 ? (
        <section className="operation-log-panel">
          <div className="section-headline">
            <div>
              <span>落地日志</span>
              <h3>最近操作</h3>
            </div>
          </div>
          <ul className="operation-log-list">
            {operationLogs.map((item) => (
              <li className="operation-log-item" key={item.id}>
                <span className="operation-log-time">{item.time}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
