import {
  apiSuccess,
  apiError,
  buildApiContext
} from '../_shared/phase1Api.js';
import {
  fetchStudentById,
  fetchStudentCourses,
  fetchLessonAccountsByInstitution,
  fetchPaymentRecordsByInstitution,
  fetchReviewByStudent,
  fetchStudentTasksByStudent
} from '../_shared/dbLayer.js';
import { parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function calculateSummary(tasks = []) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const done = list.filter((item) => STR(item.status) === 'done').length;
  const average = total
    ? Math.round(list.reduce((acc, item) => acc + Number(item.score || 0), 0) / total)
    : 0;

  return {
    totalTasks: total,
    doneTasks: done,
    doneRate: total ? Math.round((done / total) * 100) : 0,
    averageScore: average
  };
}

function formatReportText(student, summary = {}, courses = [], accounts = [], payments = [], tasks = [], todayTasks = []) {
  const summaryText = `学生：${student?.name || student?.studentName || '未命名'}`;
  const header = [
    '【星伴英语 学生阶段报告】',
    summaryText,
    `学习汇总：完成率 ${summary.doneRate || 0}%（${summary.doneTasks || 0}/${summary.totalTasks || 0}）`,
    `最近评分：${summary.averageScore || 0} 分`,
    `课程数：${courses.length} 门`,
    `课时：已上 ${accounts.reduce((acc, item) => acc + Number(item.used_hours || item.consumed_hours || 0), 0)}，剩余 ${accounts.reduce((acc, item) => acc + Number(item.remaining_hours || 0), 0)}`,
    `缴费记录：${payments.length} 笔`,
    `今日待学任务：${todayTasks.length} 项`,
    ''
  ];

  const recent = (tasks || []).slice(0, 6).map((item) => {
    const status = STR(item.status || '').trim();
    return `- ${item.task_type || item.type || '任务'} | ${status || '待定'} | 分数：${item.score || 0}`;
  });
  const paymentLines = (payments || []).slice(0, 6).map((item) => (
    `- ${item.order_no || item.id || '无单号'} / ${item.status || 'unknown'} / ¥${((Number(item.amount_cents || item.amount || 0) || 0) / 100).toFixed(2)}`
  ));

  return [
    ...header,
    '最近任务：',
    ...(recent.length ? recent : ['- 无']),
    '',
    '近期开票：',
    ...(paymentLines.length ? paymentLines : ['- 无'])
  ].join('\n');
}

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
  if (!['student', 'founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'GET') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);

  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const targetStudentId = STR(role === 'platform'
    ? parsed.searchParams.get('studentId')
    : auth?.user?.studentId || auth?.user?.childId || auth?.user?.id);
  if (!targetStudentId) {
    return apiError('student id required', 400, 400, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, targetStudentId);
  if (!student) {
    return apiError('student not found', 404, 404, ctx);
  }

  const coursesRaw = await fetchStudentCourses(env.DB, targetStudentId, institutionId);
  const accountsRaw = await fetchLessonAccountsByInstitution(env.DB, institutionId);
  const paymentsRaw = await fetchPaymentRecordsByInstitution(env.DB, {
    institutionId,
    studentId: targetStudentId
  });
  const tasksRaw = await fetchReviewByStudent(env.DB, targetStudentId, institutionId, 50);
  const today = new Date().toISOString().slice(0, 10);
  const todayTasksRaw = await fetchStudentTasksByStudent(env.DB, targetStudentId, institutionId, today);

  const courses = Array.isArray(coursesRaw) ? coursesRaw : [];
  const accounts = Array.isArray(accountsRaw)
    ? accountsRaw.filter((item) => STR(item.student_id) === targetStudentId)
    : [];
  const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];
  const todayTasks = Array.isArray(todayTasksRaw) ? todayTasksRaw : [];
  const tasks = Array.isArray(tasksRaw) ? tasksRaw : [];
  const summary = calculateSummary(tasks);

  return apiSuccess({
    studentId: targetStudentId,
    studentName: student.name,
    summary,
    fileName: `starmate-student-report-${targetStudentId}-${new Date().toISOString().slice(0, 10)}.txt`,
    contentType: 'text/plain;charset=utf-8',
    content: formatReportText(student, summary, courses, accounts, payments, tasks, todayTasks)
  }, ctx);
}
