import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../../_shared/phase1Api.js';
import {
  fetchCourseById,
  insertLeadMessage,
  insertPaymentRecord,
  insertStudent,
  upsertCourseEnrollment,
  updateLead
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();
const toInt = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : fallback;
};

const CONVERT_STAGE_LABELS = {
  student: '学生创建',
  lessonAccount: '课时账户',
  paymentRecord: '收费记录',
  courseEnrollment: '课程报名'
};

const buildSegment = (stage, status, message = '') => ({
  stage,
  label: CONVERT_STAGE_LABELS[stage] || stage,
  status,
  message
});

const buildCoursePreflightFailure = () => ([
  buildSegment('student', 'skipped', '课程校验未通过，未创建学生'),
  buildSegment('lessonAccount', 'skipped', '课程校验未通过，未创建课时账户'),
  buildSegment('paymentRecord', 'skipped', '课程校验未通过，未创建收费记录'),
  buildSegment('courseEnrollment', 'failed', '课程不存在或不可报名')
]);

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
  if (!institutionId && role !== 'platform') {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const lead = await env.DB
    .prepare(
      `SELECT id, institution_id, guardian_name, student_grade, need_summary
       FROM leads
       WHERE id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}`
    )
    .bind(...(institutionId ? [leadId, institutionId] : [leadId]))
    .first();

  if (!lead?.id) {
    return apiError('lead not found', 404, 404, ctx);
  }

  const payload = await parseJsonBody(request);
  const studentName = STR(payload?.studentName || lead.guardian_name || '咨询转正式学生');
  const grade = STR(payload?.grade || lead.student_grade || '一年级');
  const teacherId = STR(payload?.teacherId);
  const courseId = STR(payload?.courseId);
  const enrolled = STR(payload?.enroll) === 'true' || toInt(payload?.enroll, 1) === 1;
  const paymentAmountCents = toInt(payload?.paymentAmountCents, 0);
  const paymentMethod = STR(payload?.paymentMethod);
  const orderNo = STR(payload?.orderNo);
  const notes = STR(payload?.notes);

  if (enrolled && courseId) {
    const course = await fetchCourseById(env.DB, courseId, lead.institution_id);
    if (!course?.id) {
      return apiSuccess(
        {
          leadId: lead.id,
          studentId: null,
          courseId,
          enrolled: false,
          converted: false,
          failedStage: 'courseEnrollment',
          segments: buildCoursePreflightFailure(),
          payment: null
        },
        ctx
      );
    }
  }

  const student = await insertStudent(env.DB, {
    institutionId: lead.institution_id,
    name: studentName,
    grade,
    teacherId,
    guardianName: lead.guardian_name,
    guardianPhone: STR(payload?.guardianPhone),
    guardianWechat: STR(payload?.guardianWechat),
    weaknessPoints: STR(lead.need_summary),
    renewalRisk: toInt(payload?.renewalRisk, 0)
  });

  if (!student?.id) {
    return apiSuccess(
      {
        leadId: lead.id,
        studentId: null,
        courseId: courseId || null,
        enrolled: false,
        converted: false,
        failedStage: 'student',
        segments: [
          buildSegment('student', 'failed', '学生创建失败'),
          buildSegment('lessonAccount', 'skipped', '学生创建失败，未创建课时账户'),
          buildSegment('paymentRecord', 'skipped', '学生创建失败，未创建收费记录'),
          buildSegment('courseEnrollment', 'skipped', '学生创建失败，未报名课程')
        ],
        payment: null
      },
      ctx
    );
  }

  const segments = [
    buildSegment('student', 'success', `已创建学生 ${student.id}`),
    buildSegment('lessonAccount', 'skipped', '当前转化流程未自动创建课时账户')
  ];

  if (enrolled && courseId) {
    await upsertCourseEnrollment(env.DB, {
      id: '',
      institutionId: lead.institution_id,
      courseId,
      studentId: student.id,
      status: STR(payload?.enrollmentStatus || 'active'),
      source: 'founder_convert'
    });
  }

  let payment;
  if (courseId && paymentAmountCents > 0) {
    payment = await insertPaymentRecord(env.DB, {
      institutionId: lead.institution_id,
      studentId: student.id,
      courseId,
      amountCents: paymentAmountCents,
      currency: STR(payload?.currency || 'CNY'),
      paymentMethod,
      status: STR(payload?.paymentStatus || 'paid'),
      paidAt: STR(payload?.paidAt || new Date().toISOString()),
      notes,
      orderNo
    });
  }

  segments.push(payment
    ? buildSegment('paymentRecord', 'success', `已创建收费记录 ${payment.id || ''}`.trim())
    : buildSegment('paymentRecord', 'skipped', '未填写收费金额，未创建收费记录'));
  segments.push(enrolled && courseId
    ? buildSegment('courseEnrollment', 'success', '已报名课程')
    : buildSegment('courseEnrollment', 'skipped', '未选择课程报名'));

  await updateLead(env.DB, lead.id, lead.institution_id, {
    status: 'converted'
  });
  await insertLeadMessage(env.DB, {
    leadId: lead.id,
    actorRole: role,
    sender: STR(auth?.user?.name || role),
    message: `咨询线索已转正式学生：${studentName}（学号 ${student.id}）`,
    tone: 'manual'
  });

  return apiSuccess(
    {
      leadId: lead.id,
      studentId: student.id,
      courseId: courseId || null,
      enrolled,
      converted: true,
      failedStage: null,
      segments,
      payment
    },
    ctx
  );
}
