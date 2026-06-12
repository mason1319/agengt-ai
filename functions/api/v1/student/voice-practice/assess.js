import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../_shared/phase1Api.js';
import { insertVoicePractice, fetchStudentById } from '../../_shared/dbLayer.js';
import { parseAuthContext } from '../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function scoreToFeedback(score) {
  if (score >= 90) {
    return '口语表达清晰，建议增加连贯度练习。';
  }
  if (score >= 70) {
    return '表达可用，建议重点复习连读和音节重音。';
  }
  if (score >= 50) {
    return '发音需要加强，建议逐句慢读 3 遍。';
  }
  return '当前发音偏弱，先从音标和短句模仿开始。';
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

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const auth = await parseAuthContext(request, env);
  if (!auth || auth.role !== 'student') {
    return apiError('Student role required', 403, 403, ctx);
  }

  const payload = await parseJsonBody(request);
  const studentId = STR(auth.user?.studentId || payload?.studentId);
  const institutionId = STR(auth.user?.institutionId || payload?.institutionId);
  const transcript = STR(payload?.transcript || '');
  const taskId = STR(payload?.taskId || '');
  const rawScore = Number(payload?.score || 0);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.round(rawScore)) : 0;

  if (!studentId || !institutionId || !transcript) {
    return apiError('studentId, institutionId, transcript required', 400, 400, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, studentId);
  if (!student) {
    return apiError('student not found', 404, 404, ctx);
  }

  const record = await insertVoicePractice(env.DB, {
    institutionId,
    studentId,
    userId: auth.user.id,
    taskId,
    transcript,
    score,
    result: scoreToFeedback(score),
    suggestions: [
      '先读三遍标准音频',
      '再按重音分词重读',
      '最后完整复述 2 句'
    ]
  });

  if (!record) {
    return apiError('Voice practice submit failed', 500, 500, ctx);
  }

  return apiSuccess(
    {
      studentId,
      taskId,
      score,
      result: scoreToFeedback(score),
      record
    },
    ctx
  );
}
