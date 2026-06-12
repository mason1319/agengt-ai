import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';
import {
  fetchInstitutionById,
  fetchStudentsByInstitution,
  insertAiUsage,
  increaseInstitutionAiUsage,
  insertAiAuditLog
} from '../_shared/dbLayer.js';

const ALLOWED_ACTIONS = ['feedback_from_lesson', 'exercise_generate', 'renewal_risk_scan'];

const AGENT_NAME_BY_ACTION = {
  feedback_from_lesson: '星语官',
  exercise_generate: '星练官',
  renewal_risk_scan: '星守官'
};

const AGENT_ROLE_ALLOWLIST = {
  feedback_from_lesson: ['founder', 'teacher'],
  exercise_generate: ['founder', 'teacher'],
  renewal_risk_scan: ['founder', 'platform']
};

const AI_ACTION_ALIAS = {
  oral_feedback: 'feedback_from_lesson',
  speech_feedback: 'feedback_from_lesson',
  exercise: 'exercise_generate',
  generate_exercise: 'exercise_generate',
  pronunciation_drill: 'exercise_generate',
  oral_drill: 'exercise_generate',
  renewal_scan: 'renewal_risk_scan',
  renewal_risk: 'renewal_risk_scan',
  ai_assist: 'exercise_generate',
  feedback: 'feedback_from_lesson'
};

const AI_PROVIDER_PRESETS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    label: 'OpenAI'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    label: 'DeepSeek'
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    label: 'Qwen'
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-plus',
    label: '智谱GLM'
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    label: '月之暗面'
  },
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'ep-202406',
    label: '豆包'
  }
};

const AI_RESPONSE_TIMEOUT_MS = 12_000;

function normalizeAction(value) {
  const action = `${value || ''}`.trim().toLowerCase();
  if (AI_ACTION_ALIAS[action]) {
    return AI_ACTION_ALIAS[action] || '';
  }
  return ALLOWED_ACTIONS.includes(action) ? action : '';
}

function normalizeString(value, fallback = '') {
  return `${value || ''}`.trim() || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fallbackStudentName(studentName) {
  return normalizeString(studentName, '当前学生');
}

function fallbackFromLesson(payload = {}) {
  const student = fallbackStudentName(payload.studentName || payload.student_name);
  const topic = normalizeString(payload.topic, '课堂核心内容');
  const grade = normalizeString(payload.grade, '五年级');

  return {
    title: '家长反馈（可编辑）',
    content: `${student}（${grade}）本节《${topic}》反馈：课堂参与度良好，建议课后安排 10 分钟口语跟读并复盘关键词，家长可用 1 次鼓励与 1 次提醒引导。`,
    suggestions: [
      '先肯定 1-2 个进步点，降低家长焦虑',
      '给出 2 个可执行家庭任务，避免泛泛措辞',
      '建议下节课提前告知目标，减少沟通噪音'
    ],
    tone: '高情商、低摩擦'
  };
}

function fallbackExercise(payload = {}) {
  const student = fallbackStudentName(payload.studentName || payload.student_name);
  const grade = normalizeString(payload.grade, '五年级');
  const topic = normalizeString(payload.topic, '英语');
  const level = normalizeString(payload.level, '中');

  return {
    title: `${grade} ${topic} 巩固练习`,
    mission: `为 ${student} 生成的 ${level} 难度任务`,
    tasks: [
      '单词卡片：口头说出 8 个关键词并录音',
      '语法拼图：10 题填空（时态 + 冠词）',
      '阅读闯关：找出文章主旨并写 2 句总结',
      '对话复述：朗读 3 句并做自我评分'
    ],
    difficulty: level,
    reward: '完成后生成个性化错题修订清单'
  };
}

function buildFallbackRiskPayload(institution = {}, students = []) {
  const riskItems = Array.isArray(students) ? students : [];
  const highRiskCount = riskItems.filter((item) => normalizeNumber(item.renewalRisk, 0) >= 70).length;
  const riskScore = Math.min(100, 22 + highRiskCount * 8 + Math.max(0, 100 - normalizeNumber(institution.aiLeft, 100)));
  const riskLevel = riskScore >= 85 ? '高' : riskScore >= 60 ? '中' : '低';

  return {
    title: `${normalizeString(institution.name, '当前机构')} 续费预警（模拟）`,
    level: riskLevel,
    score: riskScore,
    factors: [
      { key: 'AI余量', value: `剩余 ${normalizeNumber(institution.aiLeft, 0)} 次/本月` },
      { key: '活跃学员', value: `${normalizeNumber(institution.students, 0)} / ${normalizeNumber(institution.limitStudents, 0)} 人` },
      { key: '高风险学员', value: `${highRiskCount} 名` }
    ],
    recommendations: [
      '对高风险学员安排 1 次家校沟通',
      '检查最近 7 天课堂反馈是否有缺失',
      '在到期前 5 天发送学习成果周报并给出续费建议'
    ]
  };
}

function buildRiskPayload(institution = {}, students = []) {
  const riskItems = Array.isArray(students) ? students : [];
  const highRisk = riskItems.filter((item) => normalizeNumber(item.renewalRisk, 0) >= 70);
  const mediumRisk = riskItems.filter((item) => {
    const score = normalizeNumber(item.renewalRisk, 0);
    return score >= 40 && score < 70;
  });

  const riskScore = Math.min(
    100,
    20 +
      highRisk.length * 14 +
      mediumRisk.length * 5 +
      Math.max(0, 20 - normalizeNumber(institution.students, 0) / 10)
  );

  return {
    title: `机构续费健康体检：${normalizeString(institution.name, '当前机构')}`,
    level: riskScore >= 80 ? '高' : riskScore >= 55 ? '中' : '低',
    score: riskScore,
    reasons: [
      `${highRisk.length} 名高风险学员`,
      `${mediumRisk.length} 名中风险学员`,
      `AI消耗 ${normalizeNumber(institution.aiUsed, 0)} / ${normalizeNumber(institution.aiLimit, 0)} 次`
    ],
    factors: [
      {
        key: 'AI可用',
        value: `剩余 ${normalizeNumber(institution.aiLeft, 0)} 次`
      }
    ],
    recommendations: [
      '优先触发高风险学员家校沟通清单',
      '排查近7天未提交课程反馈的教师与课程',
      '提前发布续费计划与学习成果周报'
    ],
    risks: riskItems.map((item) => ({
      student: normalizeString(item.name, '学员'),
      risk: normalizeNumber(item.renewalRisk, 0)
    }))
  };
}

function normalizeInstitutionFromDb(row) {
  return {
    id: normalizeString(row?.id),
    name: normalizeString(row?.name, '未命名机构'),
    aiUsed: normalizeNumber(row?.aiUsed, 0),
    aiLimit: normalizeNumber(row?.aiLimit, 0),
    aiLeft: normalizeNumber(row?.aiLeft, normalizeNumber(row?.aiLimit, 0) - normalizeNumber(row?.aiUsed, 0)),
    students: normalizeNumber(row?.students, 0),
    limitStudents: normalizeNumber(row?.limitStudents, 0)
  };
}

function parseTokensCount(action, output = {}) {
  const joiner = ' ';
  const sourceText = `${output?.title || ''}${joiner}${output?.content || ''}${joiner}${Array.isArray(output?.tasks) ? output.tasks.join(',') : ''}${joiner}${Array.isArray(output?.recommendations) ? output.recommendations.join(',') : ''}`;
  return Math.max(1, Math.ceil(sourceText.length / 8));
}

function hasJsonMode(env = {}) {
  const mode = `${env?.AI_MODE || ''}`.trim().toLowerCase();
  return mode === 'provider' || mode === 'real';
}

function normalizeProviderResult(action, parsed = {}) {
  const content = `${parsed?.choices?.[0]?.message?.content || ''}`.trim();
  if (!content) {
    return null;
  }

  if (action === 'feedback_from_lesson') {
    return {
      title: '家长反馈（可编辑）',
      content,
      suggestions: [
        '先肯定 1-2 个进步点，降低家长焦虑',
        '给出 2 个可执行家庭任务，避免泛泛措辞',
        '建议下节课提前告知目标，减少沟通噪音'
      ],
      tone: '高情商、低摩擦'
    };
  }

  if (action === 'exercise_generate') {
    const tasks = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);

    return {
      title: '英语巩固练习',
      mission: '基于模型输出的练习建议',
      tasks,
      difficulty: '中',
      reward: '完成后可复盘错误项'
    };
  }

  return {
    title: '机构续费体检',
    level: '中',
    score: 0,
    reasons: ['AI分析返回结构化数据失败，已输出告警信息'],
    factors: [{ key: 'AI分析', value: '已返回' }],
    recommendations: [content]
  };
}

function buildProviderPayload(action, payload = {}, institution = {}) {
  if (action === 'feedback_from_lesson') {
    const student = normalizeString(payload?.studentName || payload?.student_name);
    const topic = normalizeString(payload?.topic, '课堂核心内容');
    const grade = normalizeString(payload?.grade, '五年级');
    return {
      model: `${(payload?.model || '') || 'gpt-4o-mini'}`,
      messages: [
        {
          role: 'system',
          content: '你是家校沟通助手，输出请尽量短、可执行、语气高情商。'
        },
        {
          role: 'user',
          content: `为 ${student}${grade ? `（${grade}）` : ''} 写一段本节《${topic}》课后反馈，并给 3 条建议。`
        }
      ],
      temperature: 0.5
    };
  }

  if (action === 'exercise_generate') {
    const student = normalizeString(payload?.studentName || payload?.student_name);
    const topic = normalizeString(payload?.topic, '英语');
    const grade = normalizeString(payload?.grade, '五年级');
    const level = normalizeString(payload?.level, '中');

    return {
      model: `${(payload?.model || '') || 'gpt-4o-mini'}`,
      messages: [
        {
          role: 'system',
          content: '你是学习任务生成器，输出结构化的中文任务项，给出可直接执行的练习。'
        },
        {
          role: 'user',
          content: `为 ${student} (${grade}) 生成${level}难度、主题${topic}的练习。要求结构清晰，含任务列表。`
        }
      ],
      temperature: 0.7
    };
  }

  return {
    model: `${(payload?.model || '') || 'gpt-4o-mini'}`,
    messages: [
      {
        role: 'system',
        content: '你是续费预警分析助手，给出简明风险结论。'
      },
      {
        role: 'user',
        content: `按续费风险规则输出机构名=${institution.name || '未知机构'}，学生数=${institution.students || 0}，AI使用=${institution.aiUsed || 0}/${institution.aiLimit || 0}，高风险=0~100的风控提示。`
      }
    ],
    temperature: 0.3
  };
}

function getProviderHeader(env = {}) {
  const provider = `${env?.AI_PROVIDER || 'openai'}`.trim().toLowerCase();
  const preset = AI_PROVIDER_PRESETS[provider];
  const apiKey = `${env?.AI_API_KEY || ''}`.trim();
  const apiBase = `${env?.AI_BASE_URL || preset?.baseUrl || 'https://api.openai.com/v1'}`.trim();

  if (!apiKey) {
    return null;
  }

  if (!provider || provider === 'mock') {
    return null;
  }

  return {
    baseUrl: apiBase.replace(/\/+$/, ''),
    apiKey,
    provider,
    model: `${env?.AI_MODEL || preset?.model || 'gpt-4o-mini'}`.trim(),
    providerLabel: preset?.label || provider
  };
}

function safeExtractErrorText(responseText = '') {
  try {
    const parsed = JSON.parse(responseText || '{}');
    return parsed?.error?.message || parsed?.message || responseText;
  } catch (error) {
    return responseText;
  }
}

function extractProviderOutputText(parsed = {}) {
  if (!parsed || typeof parsed !== 'object') {
    return '';
  }

  if (typeof parsed?.result === 'string' && parsed.result.trim()) {
    return parsed.result.trim();
  }

  const fromChoices = parsed?.choices?.[0]?.message?.content;
  if (typeof fromChoices === 'string' && fromChoices.trim()) {
    return fromChoices.trim();
  }

  const fromOutput = parsed?.output?.choices?.[0]?.message?.content;
  if (typeof fromOutput === 'string' && fromOutput.trim()) {
    return fromOutput.trim();
  }

  const fromData = parsed?.data?.text;
  return `${fromData || ''}`.trim();
}

function extractProviderUsage(parsed = {}) {
  const usage = parsed?.usage || {};
  return Number(usage?.completion_tokens || usage?.completionTokens || usage?.total_tokens || usage?.totalTokens || 0);
}

async function invokeProvider(action, payload = {}, institution = {}, env = {}) {
  const header = getProviderHeader(env);
  if (!header) {
    return { source: 'mock', reason: 'provider-not-configured' };
  }

  const providerPayload = buildProviderPayload(action, payload, institution);
  const requestPayload = {
    ...providerPayload,
    model: `${(env?.AI_MODEL || header.model || providerPayload.model || 'gpt-4o-mini').trim()}`
  };

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, Math.max(2000, AI_RESPONSE_TIMEOUT_MS));

  let response;
  try {
    response = await fetch(`${header.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${header.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timer);
    return {
      source: 'mock',
      reason: `provider-exception-${error?.name || 'network'}-${error?.message || 'request failed'}`
    };
  } finally {
    clearTimeout(timer);
  }

  if (!response || !response.ok) {
    const errorText = response ? await response.text().catch(() => '') : '';
    return {
      source: 'mock',
      reason: `provider-http-${response?.status || 'network'}${safeExtractErrorText(errorText) ? `:${safeExtractErrorText(errorText)}` : ''}`
    };
  }

  const parsed = await response.json().catch(() => ({}));
  const providerText = extractProviderOutputText(parsed);
  const output = normalizeProviderResult(action, {
    ...parsed,
    choices: providerText
      ? [
          {
            message: {
              content: providerText
            }
          }
        ]
      : []
  });
  if (!output) {
    return { source: 'mock', reason: 'provider-invalid-output' };
  }

  return {
    source: 'provider',
    output: {
      ...output,
      model: requestPayload.model,
      provider: header.provider,
      providerLabel: header.providerLabel,
      rawUsage: extractProviderUsage(parsed)
    },
    usageTokens: extractProviderUsage(parsed)
  };
}

function sanitizeAuditPayload(payload = {}) {
  return {
    studentName: `${payload?.studentName || payload?.student_name || ''}`.trim(),
    topic: `${payload?.topic || ''}`.trim(),
    grade: `${payload?.grade || ''}`.trim()
  };
}

function readIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    ''
  ).split(',')[0].trim();
}

async function writeAudit({
  db,
  institutionId,
  userId,
  role,
  action,
  decision,
  reason,
  source,
  latencyMs,
  tokensUsed,
  payload = {},
  request,
  requestId
}) {
  if (!db) {
    return;
  }

  try {
    await insertAiAuditLog(db, {
      institutionId: normalizeString(institutionId),
      userId: userId || null,
      role,
      action,
      decision,
      reason: reason || '',
      source: source || 'mock',
      clientIp: readIp(request),
      requestPayload: JSON.stringify(sanitizeAuditPayload(payload)),
      latencyMs,
      tokensUsed: Number.isFinite(Number(tokensUsed)) ? Math.max(0, Number(tokensUsed)) : 0,
      requestId: `${requestId || ''}`
    });
  } catch (error) {
    console.error('[ai-agent] audit failed', error);
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const startMs = Date.now();
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const db = env?.DB || null;
  const authContext = await parseAuthContext(request, env);
  const role = authContext?.role || 'founder';
  const body = await request.json().catch(() => ({}));
  const action = normalizeAction(body?.action || body?.scene || body?.assist || body?.mode);
  const payload = body?.payload && typeof body?.payload === 'object' ? body.payload : body || {};

  const url = new URL(request.url);
  const institutionId = normalizeString(
    body?.institutionId ||
      authContext?.user?.institutionId ||
      url.searchParams.get('institutionId')
  );

  if (!action) {
    await writeAudit({
      db,
      institutionId,
      userId: authContext?.user?.id,
      role,
      action: 'invalid-action',
      decision: 'denied',
      reason: 'invalid action',
      source: 'mock',
      latencyMs: Date.now() - startMs,
      tokensUsed: 0,
      payload,
      request,
      requestId
    });
    return jsonResponse({ success: false, error: 'invalid action' }, 400);
  }

  const allowlist = AGENT_ROLE_ALLOWLIST[action] || [];
  if (!allowlist.includes(role)) {
    await writeAudit({
      db,
      institutionId,
      userId: authContext?.user?.id,
      role,
      action,
      decision: 'denied',
      reason: 'role is not allowed for this agent',
      source: 'mock',
      latencyMs: Date.now() - startMs,
      tokensUsed: 0,
      payload,
      request,
      requestId
    });
    return jsonResponse({ success: false, error: 'role is not allowed for this agent' }, 403);
  }

  if (role === 'platform' && !institutionId && action === 'renewal_risk_scan') {
    await writeAudit({
      db,
      institutionId,
      userId: authContext?.user?.id,
      role,
      action,
      decision: 'denied',
      reason: 'institutionId required for platform role',
      source: 'mock',
      latencyMs: Date.now() - startMs,
      tokensUsed: 0,
      payload,
      request,
      requestId
    });
    return jsonResponse({ success: false, error: 'institutionId required for platform role' }, 400);
  }

  const hasDb = Boolean(db);
  let institution = {
    name: role === 'platform' ? '平台总机构' : '模拟机构'
  };
  let students = [];

  if (action === 'renewal_risk_scan' && hasDb && institutionId) {
    institution = await fetchInstitutionById(db, institutionId);
    if (!institution) {
      await writeAudit({
        db,
        institutionId,
        userId: authContext?.user?.id,
        role,
        action,
        decision: 'denied',
        reason: 'institution not found',
        source: 'mock',
        latencyMs: Date.now() - startMs,
        tokensUsed: 0,
        payload,
        request,
        requestId
      });
      return jsonResponse({ success: false, error: 'institution not found' }, 404);
    }

    students = await fetchStudentsByInstitution(db, institutionId, 200);
  }

  let output = {};
  if (action === 'feedback_from_lesson') {
    output = fallbackFromLesson(payload);
  } else if (action === 'exercise_generate') {
    output = fallbackExercise(payload);
  } else {
    const normalizedInstitution = normalizeInstitutionFromDb(institution);
    output = hasDb ? buildRiskPayload(normalizedInstitution, students) : buildFallbackRiskPayload(normalizedInstitution, students);
  }

  let source = env?.AI_MODE === 'mock' ? 'mock' : 'provider';
  let usageTokens = 0;
  if (hasJsonMode(env)) {
    const invoked = await invokeProvider(action, payload, institution, env);
    if (invoked?.output && invoked.source === 'provider') {
      output = { ...invoked.output, source: 'provider' };
      source = 'provider';
      usageTokens = Number.isFinite(Number(invoked?.usageTokens)) ? Number(invoked.usageTokens) : 0;
    } else {
      source = 'mock';
      output = {
        ...output,
        source: 'mock',
        providerFallback: invoked?.reason || 'provider unavailable'
      };
      await writeAudit({
        db,
        institutionId,
        userId: authContext?.user?.id,
        role,
        action,
        decision: 'mock-fallback',
        reason: invoked?.reason || 'provider unavailable',
        source,
        latencyMs: Date.now() - startMs,
        tokensUsed: parseTokensCount(action, output),
        payload,
        request,
        requestId
      });
    }
  }

  const agentCode = AGENT_NAME_BY_ACTION[action] || action;
  const safeOutput = {
    ...output,
    source
  };

  const tokensUsed = usageTokens > 0 ? usageTokens : parseTokensCount(action, safeOutput);

  if (hasDb && institutionId) {
    const usagePayload = {
      institutionId,
      userId: authContext?.user?.id,
      agentCode,
      tokensUsed
    };

    await insertAiUsage(db, usagePayload);
    await increaseInstitutionAiUsage(db, institutionId, tokensUsed);
  }

  await writeAudit({
    db,
    institutionId,
    userId: authContext?.user?.id,
    role,
    action,
    decision: 'allowed',
    reason: '',
    source,
    latencyMs: Date.now() - startMs,
    tokensUsed,
    payload,
    request,
    requestId
  });

  return jsonResponse({
    success: true,
    agent: agentCode,
    action,
    output: safeOutput,
    institutionId,
    source
  });
}
