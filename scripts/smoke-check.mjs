#!/usr/bin/env node
import { setTimeout as wait } from 'timers/promises';

const baseUrl = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 12000);
const strictMode = `${process.env.SMOKE_STRICT_AUTH || ''}`.toLowerCase() === 'true';
const allowSkip = `${process.env.SMOKE_ALLOW_SKIP || 'true'}`.toLowerCase() !== 'false';

const colors = {
  ok: '\x1b[32m',
  warn: '\x1b[33m',
  fail: '\x1b[31m',
  reset: '\x1b[0m'
};

const demoCredentials = {
  platform: { username: 'platform', password: 'Platform@123' },
  founder: { username: 'founder', password: 'Founder@123' },
  teacher: { username: 'teacher', password: 'Teacher@123' },
  parent: { username: 'parent', password: 'Parent@123' },
  student: { username: 'student', password: 'Student@123' }
};
function getTokenCandidate(roleUpper) {
  const candidates = [
    `STARMATE_TOKEN_${roleUpper}`,
    `STAGE2_TOKEN_${roleUpper}`,
    `PHASE2_TOKEN_${roleUpper}`
  ];
  const foundKey = candidates.find((key) => Boolean(process.env[key]));
  return {
    token: foundKey ? `${process.env[foundKey]}` : '',
    source: foundKey || ''
  };
}

function printStatus(level, message, detail = '') {
  const color = colors[level] || colors.reset;
  const prefix = level === 'ok' ? '[OK]' : level === 'warn' ? '[WARN]' : '[FAIL]';
  process.stdout.write(`${color}${prefix}${colors.reset} ${message}`);
  if (detail) {
    process.stdout.write(` ${detail}`);
  }
  process.stdout.write('\n');
}

async function request({
  method = 'GET',
  path,
  token = '',
  body = undefined,
  expectStatus = 200,
  retries = 0
}) {
  const headers = {
    Accept: 'application/json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const endpoint = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const res = await fetch(endpoint, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
    const responseText = await res.text();
    let payload = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch (_ignore) {
      // keep raw text fallback
    }

    const elapsed = Date.now() - started;
    const ok = res.status === expectStatus || (Array.isArray(expectStatus) ? expectStatus.includes(res.status) : false);
    return {
      ok,
      status: res.status,
      payload,
      text: payload ? null : responseText,
      elapsedMs: elapsed,
      path
    };
  } catch (error) {
    if (retries > 0) {
      await wait(200);
      return request({
        method,
        path,
        token,
        body,
        expectStatus,
        retries: retries - 1
      });
    }
    return {
      ok: false,
      status: 0,
      error: error?.message || 'request failed',
      hint: error?.message?.includes('fetch')
        ? `请先执行 npm run stack:verify 或确保后端服务监听 ${baseUrl}`
        : undefined,
      path
    };
  } finally {
    clearTimeout(timer);
  }
}

async function login(role, explicitToken = '') {
  if (explicitToken) {
    return explicitToken.trim();
  }

  const creds = demoCredentials[role];
  if (!creds) {
    return '';
  }

  const result = await request({
    method: 'POST',
    path: '/api/v1/auth/login',
    body: {
      role,
      username: creds.username,
      password: creds.password
    },
    expectStatus: 200,
    retries: 1
  });
  return result.ok ? `${result.payload?.data?.token || ''}` : '';
}

function hasJsonSuccess(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    ((typeof payload.success === 'boolean' && payload.success === true) || payload.code === 0)
  );
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(name, fn) {
  try {
    await fn();
    printStatus('ok', name);
    return true;
  } catch (error) {
    const rawMessage = error?.message || 'unknown';
    const withHint = rawMessage.startsWith('http 0')
      ? `${rawMessage}（后端未就绪，建议先执行 npm run stack:verify）`
      : rawMessage;
    printStatus('fail', name, `(${withHint})`);
    return false;
  }
}

async function runWithResult(name, fn) {
  const ok = await run(name, fn);
  await wait(10);
  return ok;
}

async function runPhase2Smoke() {
  let total = 0;
  let passed = 0;
  const fails = [];
  const skipped = [];
  const checkDetails = [];
  const startedAt = new Date().toISOString();
  const tokenSources = {};

  const roleTokens = {};
  const roleList = ['platform', 'founder', 'teacher', 'parent', 'student'];

  for (const role of roleList) {
    const roleUpper = role.toUpperCase();
    const { token: envToken, source } = getTokenCandidate(roleUpper);
    const token = await login(role, envToken);
    if (token) {
      roleTokens[role] = token;
      tokenSources[role] = source || 'demo-login';
    }
  }

  const publicChecks = [
    {
      name: 'health',
      ok: () =>
        request({
          method: 'GET',
          path: '/api/v1/health',
          expectStatus: 200
        }).then((res) => {
          ensure(res.ok, `http ${res.status}`);
          ensure(
            (res.payload?.status === 'ok') || hasJsonSuccess(res.payload),
            'response success=false'
          );
          ensure(Boolean(res.payload?.now), 'health should include now');
        })
    },
    {
      name: 'public courses list',
      ok: () =>
        request({
          method: 'GET',
          path: '/api/v1/public/courses?limit=10',
          expectStatus: 200
        }).then((res) => {
          ensure(res.ok, `http ${res.status}`);
          ensure(hasJsonSuccess(res.payload), 'response success=false');
          ensure(Array.isArray(res.payload?.data?.courses), 'courses should be array');
        })
    },
    {
      name: 'bootstrap role=founder (no token)',
      ok: () =>
        request({
          method: 'GET',
          path: '/api/v1/bootstrap?role=founder',
          expectStatus: 200
        }).then((res) => {
          ensure(res.ok, `http ${res.status}`);
          ensure(res.payload?.role === 'founder', 'bootstrap role mismatch');
          ensure(res.payload?.meta?.role === 'founder', 'bootstrap meta role mismatch');
        })
    },
    {
      name: 'bootstrap role=platform (no token)',
      ok: () =>
        request({
          method: 'GET',
          path: '/api/v1/bootstrap?role=platform',
          expectStatus: 200
        }).then((res) => {
          ensure(res.ok, `http ${res.status}`);
          ensure(res.payload?.role === 'platform', 'bootstrap role mismatch');
          ensure(res.payload?.meta?.role === 'platform', 'bootstrap meta role mismatch');
        })
    },
    {
      name: 'culture wall admissions placement',
      ok: () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return Promise.resolve();
        }

        return request({
          method: 'GET',
          path: '/api/v1/admin/culture-wall?placement=admissions',
          token,
          expectStatus: 200
        }).then((res) => {
          ensure(res.ok, `http ${res.status}`);
          ensure(hasJsonSuccess(res.payload), 'response success=false');
          const photos = res.payload?.data?.cultureWall?.photos || [];
          ensure(Array.isArray(photos), 'admissions photos missing');
          ensure(
            photos.every((item) => `${item.placement || ''}`.trim() === 'admissions'),
            'admissions placement leaked non-admissions assets'
          );
        });
      }
    },
    {
      name: 'public leads list',
      ok: () =>
        request({
          method: 'GET',
          path: '/api/v1/public/leads?institutionId=inst-star&limit=5',
          expectStatus: 200
        }).then((res) => {
          ensure(res.ok, `http ${res.status}`);
          ensure(hasJsonSuccess(res.payload), 'response success=false');
          ensure(typeof res.payload?.data?.total === 'number', 'leads.total missing');
        })
    },
    {
      name: 'public lead create + ai reply',
      ok: async () => {
        const lead = await request({
          method: 'POST',
          path: '/api/v1/public/leads',
          body: {
            institutionId: 'inst-star',
            guardianName: `家长-${Date.now()}`,
            studentGrade: '小学三年级',
            needSummary: '试听课',
            privacyConsent: true,
            initialMessage: '我想先咨询一下孩子课程'
          },
          expectStatus: 200
        });
        ensure(lead.ok, `http ${lead.status}`);
        ensure(hasJsonSuccess(lead.payload), 'response success=false');
        const leadId = `${lead.payload?.data?.lead?.id || ''}`.trim();
        ensure(leadId, 'lead id missing');

        const aiReply = await request({
          method: 'POST',
          path: `/api/v1/public/leads/${leadId}/ai-reply`,
          body: {
            message: '请安排下周一试听',
            needSummary: '试听咨询'
          },
          expectStatus: 200
        });
        ensure(aiReply.ok, `http ${aiReply.status}`);
        ensure(hasJsonSuccess(aiReply.payload), 'response success=false');
        ensure(String(aiReply.payload?.data?.leadId || '') === leadId, 'ai-reply leadId mismatch');
      }
    },
    {
      name: 'public trial booking submit',
      ok: async () => {
        const courseRes = await request({
          method: 'GET',
          path: '/api/v1/public/courses?institutionId=inst-star&limit=1',
          expectStatus: 200
        });
        ensure(courseRes.ok, `http ${courseRes.status}`);
        ensure(hasJsonSuccess(courseRes.payload), 'response success=false');
        const courseId = `${courseRes.payload?.data?.courses?.[0]?.id || ''}`.trim();
        ensure(courseId, 'courseId missing');

        const lead = await request({
          method: 'POST',
          path: '/api/v1/public/leads',
          body: {
            institutionId: 'inst-star',
            guardianName: `试听家长-${Date.now()}`,
            studentGrade: '小学三年级',
            needSummary: '试听课程',
            privacyConsent: true,
            initialMessage: '我要安排试听'
          },
          expectStatus: 200
        });
        ensure(lead.ok, `http ${lead.status}`);
        ensure(hasJsonSuccess(lead.payload), 'response success=false');
        const leadId = `${lead.payload?.data?.lead?.id || ''}`.trim();
        ensure(leadId, 'lead id missing');

        const booking = await request({
          method: 'POST',
          path: '/api/v1/public/trial-bookings',
          body: {
            institutionId: 'inst-star',
            leadId,
            courseId,
            reservedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            durationMinutes: 45,
            status: 'pending',
            sourceChannel: 'web',
            notes: '收银台验收预约'
          },
          expectStatus: 200
        });
        ensure(booking.ok, `http ${booking.status}`);
        ensure(hasJsonSuccess(booking.payload), 'response success=false');
        ensure(Boolean(booking.payload?.data?.booking?.id), 'booking id missing');
        ensure(booking.payload?.data?.status === 'pending', 'booking status should be pending');
        ensure(`${booking.payload?.data?.courseSummary?.id || ''}`.trim() === courseId, 'courseSummary.id should match selected courseId');
      }
    }
  ];

  const authChecks = [
    {
      name: 'platform login and me',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const me = await request({
          method: 'GET',
          path: '/api/v1/me',
          token,
          expectStatus: 200
        });
        ensure(me.ok, `http ${me.status}`);
        ensure(hasJsonSuccess(me.payload), 'response success=false');
        ensure(me.payload?.data?.user?.role === 'platform', 'me role mismatch');
      }
    },
    {
      name: 'platform scope: institutions',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const institutions = await request({
          method: 'GET',
          path: '/api/v1/admin/institutions?limit=10',
          token,
          expectStatus: 200
        });
        ensure(institutions.ok, `http ${institutions.status}`);
        ensure(hasJsonSuccess(institutions.payload), 'response success=false');
      }
    },
    {
      name: 'platform ai usage',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const usage = await request({
          method: 'GET',
          path: '/api/v1/admin/ai-usage?days=30&limit=20',
          token,
          expectStatus: 200
        });
        ensure(usage.ok, `http ${usage.status}`);
        ensure(hasJsonSuccess(usage.payload), 'response success=false');
      }
    },
    {
      name: 'platform ai audit',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const audit = await request({
          method: 'GET',
          path: '/api/v1/admin/ai-audit?limit=10',
          token,
          expectStatus: 200
        });
        ensure(audit.ok, `http ${audit.status}`);
        ensure(hasJsonSuccess(audit.payload), 'response success=false');
      }
    },
    {
      name: 'platform institutions export',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const response = await request({
          method: 'GET',
          path: '/api/v1/admin/institutions-export',
          token,
          expectStatus: 200
        });
        ensure(response.ok, `http ${response.status}`);
        ensure(hasJsonSuccess(response.payload), 'response success=false');
        ensure(Boolean(response.payload?.data?.fileName), 'export fileName missing');
        ensure(Boolean(response.payload?.data?.content), 'export content missing');
      }
    },
    {
      name: 'platform ai usage export',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const response = await request({
          method: 'GET',
          path: '/api/v1/admin/ai-usage-export?days=30&limit=20',
          token,
          expectStatus: 200
        });
        ensure(response.ok, `http ${response.status}`);
        ensure(hasJsonSuccess(response.payload), 'response success=false');
        ensure(Boolean(response.payload?.data?.fileName), 'export fileName missing');
        ensure(Boolean(response.payload?.data?.content), 'export content missing');
      }
    },
    {
      name: 'platform ai audit export',
      role: 'platform',
      ok: async () => {
        const token = roleTokens.platform;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('platform token unavailable');
          }
          printStatus('warn', 'platform token unavailable, skip');
          return;
        }
        const response = await request({
          method: 'GET',
          path: '/api/v1/admin/ai-audit-export?limit=10',
          token,
          expectStatus: 200
        });
        ensure(response.ok, `http ${response.status}`);
        ensure(hasJsonSuccess(response.payload), 'response success=false');
        ensure(Boolean(response.payload?.data?.fileName), 'export fileName missing');
        ensure(Boolean(response.payload?.data?.content), 'export content missing');
      }
    },
    {
      name: 'founder cockpit',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const cockpit = await request({
          method: 'GET',
          path: '/api/v1/founder/cockpit?courseStatus=active',
          token,
          expectStatus: 200
        });
        ensure(cockpit.ok, `http ${cockpit.status}`);
        ensure(hasJsonSuccess(cockpit.payload), 'response success=false');
      }
    },
    {
      name: 'founder leads list',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const leads = await request({
          method: 'GET',
          path: '/api/v1/founder/leads?limit=10',
          token,
          expectStatus: 200
        });
        ensure(leads.ok, `http ${leads.status}`);
        ensure(hasJsonSuccess(leads.payload), 'response success=false');
        ensure(Array.isArray(leads.payload?.data?.items), 'founder leads items missing');
      }
    },
    {
      name: 'founder lead convert returns segmented course enrollment failure',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }

        const lead = await request({
          method: 'POST',
          path: '/api/v1/public/leads',
          body: {
            institutionId: 'inst-star',
            guardianName: `分段转化家长-${Date.now()}`,
            studentGrade: '小学四年级',
            needSummary: '希望转正式课程',
            privacyConsent: true,
            initialMessage: '请帮我转正式学员'
          },
          expectStatus: 200
        });
        ensure(lead.ok, `http ${lead.status}`);
        ensure(hasJsonSuccess(lead.payload), 'response success=false');
        const leadId = `${lead.payload?.data?.lead?.id || ''}`.trim();
        ensure(leadId, 'lead id missing');

        const conversion = await request({
          method: 'POST',
          path: `/api/v1/founder/leads/${encodeURIComponent(leadId)}/convert`,
          token,
          body: {
            studentName: '分段转化测试学生',
            grade: '四年级',
            courseId: `missing-course-${Date.now()}`,
            enroll: '1',
            paymentStatus: 'paid'
          },
          expectStatus: 200
        });
        ensure(conversion.ok, `http ${conversion.status}`);
        ensure(hasJsonSuccess(conversion.payload), 'response success=false');
        ensure(conversion.payload?.data?.converted === false, 'converted should be false');
        const segments = Array.isArray(conversion.payload?.data?.segments)
          ? conversion.payload.data.segments
          : [];
        ensure(segments.length > 0, 'segments missing');
        const byStage = Object.fromEntries(segments.map((item) => [item.stage, item]));
        ensure(byStage.courseEnrollment?.status === 'failed', 'courseEnrollment should fail');
        ensure(byStage.student?.status === 'skipped', 'student should be skipped');
        ensure(byStage.lessonAccount?.status === 'skipped', 'lessonAccount should be skipped');
        ensure(byStage.paymentRecord?.status === 'skipped', 'paymentRecord should be skipped');
      }
    },
    {
      name: 'founder lead convert returns segments for enrollment attempt',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }

        const courseRes = await request({
          method: 'GET',
          path: '/api/v1/founder/courses?limit=1',
          token,
          expectStatus: 200
        });
        ensure(courseRes.ok, `http ${courseRes.status}`);
        ensure(hasJsonSuccess(courseRes.payload), 'courses response success=false');
        const courseId = `${courseRes.payload?.data?.courses?.[0]?.id || ''}`.trim();
        ensure(courseId, 'course id missing');

        const lead = await request({
          method: 'POST',
          path: '/api/v1/public/leads',
          body: {
            institutionId: 'inst-star',
            guardianName: `转化报名家长-${Date.now()}`,
            studentGrade: '小学四年级',
            needSummary: '希望报名正式课程',
            privacyConsent: true,
            initialMessage: '请帮我报名正式课程'
          },
          expectStatus: 200
        });
        ensure(lead.ok, `http ${lead.status}`);
        ensure(hasJsonSuccess(lead.payload), 'response success=false');
        const leadId = `${lead.payload?.data?.lead?.id || ''}`.trim();
        ensure(leadId, 'lead id missing');

        const conversion = await request({
          method: 'POST',
          path: `/api/v1/founder/leads/${encodeURIComponent(leadId)}/convert`,
          token,
          body: {
            studentName: '报名转化测试学生',
            grade: '四年级',
            courseId,
            enroll: '1',
            paymentStatus: 'paid'
          },
          expectStatus: 200
        });
        ensure(conversion.ok, `http ${conversion.status}`);
        ensure(hasJsonSuccess(conversion.payload), 'response success=false');
        const segments = Array.isArray(conversion.payload?.data?.segments)
          ? conversion.payload.data.segments
          : [];
        ensure(segments.length > 0, 'segments missing');
        const byStage = Object.fromEntries(segments.map((item) => [item.stage, item]));
        ensure(Boolean(byStage.student?.status), 'student segment missing');
        ensure(Boolean(byStage.courseEnrollment?.status), 'courseEnrollment segment missing');
        ensure(['success', 'failed', 'skipped'].includes(byStage.courseEnrollment.status), 'courseEnrollment status invalid');
      }
    },
    {
      name: 'founder reconciliation',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }

        const cockpit = await request({
          method: 'GET',
          path: '/api/v1/founder/cockpit?courseStatus=active',
          token,
          expectStatus: 200
        });
        ensure(cockpit.ok, `http ${cockpit.status}`);
        ensure(hasJsonSuccess(cockpit.payload), 'response success=false');
        const institutionId = `${cockpit.payload?.data?.institution?.id || ''}`.trim();
        ensure(Boolean(institutionId), 'founder cockpit institution id missing');

        const courses = await request({
          method: 'GET',
          path: `/api/v1/founder/courses?institutionId=${encodeURIComponent(institutionId)}&limit=50`,
          token,
          expectStatus: 200
        });
        ensure(courses.ok, `http ${courses.status}`);
        ensure(hasJsonSuccess(courses.payload), 'response success=false');
        ensure(Array.isArray(courses.payload?.data?.courses), 'founder courses items missing');

        const payments = await request({
          method: 'GET',
          path: `/api/v1/founder/payment-records?institutionId=${encodeURIComponent(institutionId)}&limit=50`,
          token,
          expectStatus: 200
        });
        ensure(payments.ok, `http ${payments.status}`);
        ensure(hasJsonSuccess(payments.payload), 'response success=false');
        ensure(Array.isArray(payments.payload?.data?.records), 'founder payment records items missing');

        const lessonAccounts = await request({
          method: 'GET',
          path: `/api/v1/founder/lesson-accounts?institutionId=${encodeURIComponent(institutionId)}&limit=50`,
          token,
          expectStatus: 200
        });
        ensure(lessonAccounts.ok, `http ${lessonAccounts.status}`);
        ensure(hasJsonSuccess(lessonAccounts.payload), 'response success=false');
        ensure(Array.isArray(lessonAccounts.payload?.data?.items), 'founder lesson accounts missing');

        const attendanceRecords = await request({
          method: 'GET',
          path: `/api/v1/founder/attendance-records?institutionId=${encodeURIComponent(institutionId)}&limit=50`,
          token,
          expectStatus: 200
        });
        ensure(attendanceRecords.ok, `http ${attendanceRecords.status}`);
        ensure(hasJsonSuccess(attendanceRecords.payload), 'response success=false');
        ensure(Array.isArray(attendanceRecords.payload?.data?.items), 'founder attendance items missing');
      }
    },
    {
      name: 'founder payment records filter and export fields',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }

        const recordsRes = await request({
          method: 'GET',
          path: '/api/v1/founder/payment-records?limit=20',
          token,
          expectStatus: 200
        });
        ensure(recordsRes.ok, `http ${recordsRes.status}`);
        ensure(hasJsonSuccess(recordsRes.payload), 'response success=false');
        const records = Array.isArray(recordsRes.payload?.data?.records) ? recordsRes.payload.data.records : [];
        if (!records.length) {
          if (strictMode || !allowSkip) {
            throw new Error('founder payment records empty');
          }
          printStatus('warn', 'founder payment records empty, skip');
          return;
        }

        const sample = records[0];
        const createdAt = `${sample.createdAt || sample.created_at || ''}`.trim();
        const createdDate = createdAt ? createdAt.slice(0, 10) : '';
        const filtered = await request({
          method: 'GET',
          path:
            `/api/v1/founder/payment-records?limit=20` +
            `&studentId=${encodeURIComponent(sample.studentId || sample.student_id || '')}` +
            `&courseId=${encodeURIComponent(sample.courseId || sample.course_id || '')}` +
            `&status=${encodeURIComponent(sample.status || '')}` +
            (createdDate ? `&startAt=${encodeURIComponent(createdDate)}&endAt=${encodeURIComponent(createdDate)}` : ''),
          token,
          expectStatus: 200
        });
        ensure(filtered.ok, `http ${filtered.status}`);
        ensure(hasJsonSuccess(filtered.payload), 'response success=false');
        const filteredRecords = Array.isArray(filtered.payload?.data?.records) ? filtered.payload.data.records : [];
        const match = filteredRecords.find((item) => `${item.id || ''}`.trim() === `${sample.id || ''}`.trim());
        ensure(Boolean(match), 'filtered payment record missing');
        ensure(Boolean(match.studentName || match.student_name), 'student name missing');
        ensure(Boolean(match.courseName || match.course_name), 'course name missing');
        ensure(Boolean(match.createdAt || match.created_at), 'createdAt missing');
      }
    },
    {
      name: 'founder course drawer create/edit flow',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }

        const cockpit = await request({
          method: 'GET',
          path: '/api/v1/founder/cockpit?courseStatus=active',
          token,
          expectStatus: 200
        });
        ensure(cockpit.ok, `http ${cockpit.status}`);
        ensure(hasJsonSuccess(cockpit.payload), 'response success=false');
        const institutionId = `${cockpit.payload?.data?.institution?.id || ''}`.trim();
        ensure(Boolean(institutionId), 'founder cockpit institution id missing');

        const tag = Date.now();
        const createPayload = {
          institutionId,
          teacherId: '',
          name: `SMOKE 课程抽屉 ${tag}`,
          grade: '五年级',
          level: '基础',
          classType: 'small',
          schedule: `第 ${tag % 100} 周周三 19:30`,
          startTime: new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
          durationMinutes: 90,
          capacity: 12,
          priceCents: 18800,
          status: 'active',
          imageUrl: ''
        };

        const created = await request({
          method: 'POST',
          path: '/api/v1/founder/courses',
          token,
          body: createPayload,
          expectStatus: 200
        });
        ensure(created.ok, `http ${created.status}`);
        ensure(hasJsonSuccess(created.payload), 'response success=false');
        const createdCourse = created.payload?.data?.course || {};
        const courseId = `${createdCourse.id || ''}`.trim();
        ensure(courseId, 'created course id missing');
        ensure(`${createdCourse.name || ''}`.trim() === createPayload.name, 'created course name mismatch');

        const patchedName = `SMOKE 课程抽屉 ${tag} - 已更新`;
        const updated = await request({
          method: 'PATCH',
          path: '/api/v1/founder/courses',
          token,
          body: {
            id: courseId,
            name: patchedName,
            grade: '六年级',
            level: '进阶',
            classType: 'one_to_one',
            schedule: `第 ${tag % 100} 周周五 20:00`,
            startTime: new Date(Date.now() + 7200_000).toISOString().slice(0, 16),
            priceCents: 20800,
            capacity: 8,
            status: 'active'
          },
          expectStatus: 200
        });
        ensure(updated.ok, `http ${updated.status}`);
        ensure(hasJsonSuccess(updated.payload), 'response success=false');
        const updatedCourse = updated.payload?.data?.course || {};
        ensure(`${updatedCourse.id || ''}`.trim() === courseId, 'updated course id mismatch');
        ensure(`${updatedCourse.name || ''}`.trim() === patchedName, 'updated course name mismatch');

        const founderList = await request({
          method: 'GET',
          path: `/api/v1/founder/courses?institutionId=${encodeURIComponent(institutionId)}&limit=50`,
          token,
          expectStatus: 200
        });
        ensure(founderList.ok, `http ${founderList.status}`);
        ensure(hasJsonSuccess(founderList.payload), 'response success=false');
        const founderCourses = Array.isArray(founderList.payload?.data?.courses)
          ? founderList.payload.data.courses
          : [];
        const founderMatch = founderCourses.find((item) => `${item.id || ''}`.trim() === courseId);
        ensure(Boolean(founderMatch), 'created course missing from founder list');
        ensure(`${founderMatch?.name || ''}`.trim() === patchedName, 'founder list did not reflect update');

        const publicList = await request({
          method: 'GET',
          path: '/api/v1/public/courses?limit=200',
          expectStatus: 200
        });
        ensure(publicList.ok, `http ${publicList.status}`);
        ensure(hasJsonSuccess(publicList.payload), 'response success=false');
        const publicCourses = Array.isArray(publicList.payload?.data?.courses)
          ? publicList.payload.data.courses
          : [];
        const publicMatch = publicCourses.find((item) => `${item.id || ''}`.trim() === courseId || `${item.name || ''}`.trim() === patchedName);
        ensure(Boolean(publicMatch), 'created course missing from public list');
      }
    },
    {
      name: 'founder lesson account adjustment requires reason',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const students = await request({
          method: 'GET',
          path: '/api/v1/institution/students?institutionId=inst-star&limit=1',
          token,
          expectStatus: 200
        });
        ensure(students.ok, `http ${students.status}`);
        ensure(hasJsonSuccess(students.payload), 'students response success=false');
        const student = (students.payload?.data?.students || [])[0] || {};
        const studentId = `${student.id || student.studentId || ''}`.trim();
        ensure(studentId, 'student id missing');

        const rejected = await request({
          method: 'POST',
          path: '/api/v1/founder/lesson-accounts?institutionId=inst-star',
          token,
          body: {
            studentId,
            purchasedHours: 1,
            amountCents: 0
          },
          expectStatus: 400
        });
        ensure(rejected.ok, `http ${rejected.status}`);

        const reason = `Phase2课时调整验收-${Date.now()}`;
        const accepted = await request({
          method: 'POST',
          path: '/api/v1/founder/lesson-accounts?institutionId=inst-star',
          token,
          body: {
            studentId,
            purchasedHours: 1,
            amountCents: 0,
            reason
          },
          expectStatus: 200
        });
        ensure(accepted.ok, `http ${accepted.status}`);
        ensure(hasJsonSuccess(accepted.payload), 'adjust response success=false');
        const record = accepted.payload?.data?.record || {};
        ensure(`${accepted.payload?.data?.reason || record.notes || record.reason || ''}`.trim() === reason, 'adjust reason missing');
      }
    },
    {
      name: 'teacher attendance returns deduction detail',
      role: 'teacher',
      ok: async () => {
        const teacherToken = roleTokens.teacher;
        const founderToken = roleTokens.founder;
        const studentToken = roleTokens.student;
        if (!teacherToken || !founderToken || !studentToken) {
          if (strictMode || !allowSkip) {
            throw new Error('teacher, founder or student token unavailable');
          }
          printStatus('warn', 'teacher, founder or student token unavailable, skip');
          return;
        }

        const todayPath = await request({
          method: 'GET',
          path: '/api/v1/student/today-path',
          token: studentToken,
          expectStatus: 200
        });
        ensure(todayPath.ok, `http ${todayPath.status}`);
        ensure(hasJsonSuccess(todayPath.payload), 'student today response success=false');
        const studentId = `${todayPath.payload?.data?.studentId || ''}`.trim();
        ensure(studentId, 'student id missing');

        const accountReason = `Phase2消课验收预置-${Date.now()}`;
        const adjusted = await request({
          method: 'POST',
          path: '/api/v1/founder/lesson-accounts?institutionId=inst-star',
          token: founderToken,
          body: {
            studentId,
            purchasedHours: 2,
            amountCents: 0,
            reason: accountReason
          },
          expectStatus: 200
        });
        ensure(adjusted.ok, `http ${adjusted.status}`);

        const courses = await request({
          method: 'GET',
          path: '/api/v1/teacher/courses?limit=10',
          token: teacherToken,
          expectStatus: 200
        });
        ensure(courses.ok, `http ${courses.status}`);
        ensure(hasJsonSuccess(courses.payload), 'teacher courses response success=false');
        const course = (courses.payload?.data?.courses || []).find((item) => {
          return `${item.studentId || item.student_id || ''}`.trim() === studentId;
        }) || (courses.payload?.data?.courses || [])[0] || {};
        const courseId = `${course.id || course.courseId || ''}`.trim();
        ensure(courseId, 'teacher course id missing');

        const attendance = await request({
          method: 'POST',
          path: `/api/v1/teacher/courses/${encodeURIComponent(courseId)}/attendance`,
          token: teacherToken,
          body: {
            studentId,
            status: 'attended',
            note: 'Phase2扣减明细验收',
            sourceLessonId: `smoke-deduct-${Date.now()}`
          },
          expectStatus: 200
        });
        ensure(attendance.ok, `http ${attendance.status}`);
        ensure(hasJsonSuccess(attendance.payload), 'attendance response success=false');
        const deduction = (attendance.payload?.data?.summary?.lessons || []).find((item) => {
          return `${item.studentId || ''}`.trim() === studentId;
        }) || {};
        ensure(Number(deduction.hoursDeducted) === 1, 'hoursDeducted should be 1');
        ensure(Number.isFinite(Number(deduction.beforeRemaining)), 'beforeRemaining missing');
        ensure(Number.isFinite(Number(deduction.afterRemaining)), 'afterRemaining missing');
        ensure(Number(deduction.beforeRemaining) - Number(deduction.afterRemaining) === 1, 'deduction balance mismatch');
      }
    },
    {
      name: 'teacher students',
      role: 'teacher',
      ok: async () => {
        const token = roleTokens.teacher;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('teacher token unavailable');
          }
          printStatus('warn', 'teacher token unavailable, skip');
          return;
        }
        const students = await request({
          method: 'GET',
          path: '/api/v1/teacher/students?limit=10',
          token,
          expectStatus: 200
        });
        ensure(students.ok, `http ${students.status}`);
        ensure(hasJsonSuccess(students.payload), 'response success=false');
        ensure(Array.isArray(students.payload?.data?.students), 'students missing array');
      }
    },
    {
      name: 'parent children',
      role: 'parent',
      ok: async () => {
        const token = roleTokens.parent;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('parent token unavailable');
          }
          printStatus('warn', 'parent token unavailable, skip');
          return;
        }
        const children = await request({
          method: 'GET',
          path: '/api/v1/parent/children?limit=10',
          token,
          expectStatus: 200
        });
        ensure(children.ok, `http ${children.status}`);
        ensure(hasJsonSuccess(children.payload), 'response success=false');
        ensure(Array.isArray(children.payload?.data?.children), 'children missing array');
      }
    },
    {
      name: 'teacher feedback visible to parent summary',
      role: 'teacher',
      ok: async () => {
        const teacherToken = roleTokens.teacher;
        const parentToken = roleTokens.parent;
        if (!teacherToken || !parentToken) {
          if (strictMode || !allowSkip) {
            throw new Error('teacher or parent token unavailable');
          }
          printStatus('warn', 'teacher or parent token unavailable, skip');
          return;
        }

        const children = await request({
          method: 'GET',
          path: '/api/v1/parent/children?limit=10',
          token: parentToken,
          expectStatus: 200
        });
        ensure(children.ok, `http ${children.status}`);
        ensure(hasJsonSuccess(children.payload), 'response success=false');
        const child = (children.payload?.data?.children || [])[0] || {};
        const childId = `${child.studentId || child.id || ''}`.trim();
        ensure(childId, 'parent child id missing');

        const teacherStudents = await request({
          method: 'GET',
          path: '/api/v1/teacher/students?limit=50',
          token: teacherToken,
          expectStatus: 200
        });
        ensure(teacherStudents.ok, `http ${teacherStudents.status}`);
        ensure(hasJsonSuccess(teacherStudents.payload), 'teacher students response success=false');
        const teacherCanAccessChild = (teacherStudents.payload?.data?.students || []).some((item) => {
          return `${item.id || item.studentId || ''}`.trim() === childId;
        });
        ensure(teacherCanAccessChild, 'teacher cannot access parent child');

        const lessons = await request({
          method: 'GET',
          path: `/api/v1/institution/lessons?institutionId=inst-star&studentId=${encodeURIComponent(childId)}&limit=5`,
          token: teacherToken,
          expectStatus: 200
        });
        ensure(lessons.ok, `http ${lessons.status}`);
        ensure(hasJsonSuccess(lessons.payload), 'lessons response success=false');
        let lesson = (lessons.payload?.data?.lessons || [])[0] || null;

        if (!lesson?.id) {
          const created = await request({
            method: 'POST',
            path: '/api/v1/institution/lessons?institutionId=inst-star',
            token: teacherToken,
            body: {
              studentId: childId,
              status: 'completed',
              topic: 'Phase2 反馈验收课',
              hoursUsed: 1,
              teacherNote: 'Smoke: teacher feedback persistence',
              parentFeedback: '',
              autoConsumeHours: false
            },
            expectStatus: 200
          });
          ensure(created.ok, `http ${created.status}`);
          ensure(hasJsonSuccess(created.payload), 'create lesson response success=false');
          lesson = created.payload?.data?.lesson || null;
        }

        const feedbackText = `Phase2家长可见反馈-${Date.now()}`;
        const updated = await request({
          method: 'PATCH',
          path: '/api/v1/institution/lessons?institutionId=inst-star',
          token: teacherToken,
          body: {
            id: lesson.id,
            parentFeedback: feedbackText
          },
          expectStatus: 200
        });
        ensure(updated.ok, `http ${updated.status}`);
        ensure(hasJsonSuccess(updated.payload), 'update lesson response success=false');
        ensure(updated.payload?.data?.lesson?.parentFeedback === feedbackText, 'lesson parentFeedback not persisted');

        const summary = await request({
          method: 'GET',
          path: `/api/v1/parent/child/${encodeURIComponent(childId)}/summary`,
          token: parentToken,
          expectStatus: 200
        });
        ensure(summary.ok, `http ${summary.status}`);
        ensure(hasJsonSuccess(summary.payload), 'parent summary response success=false');
        const feedbackItems = summary.payload?.data?.lessonFeedback || summary.payload?.data?.recentFeedback || [];
        ensure(Array.isArray(feedbackItems), 'parent summary lessonFeedback missing array');
        ensure(
          feedbackItems.some((item) => `${item.parentFeedback || item.feedback || ''}`.trim() === feedbackText),
          'parent summary missing persisted teacher feedback'
        );
      }
    },
    {
      name: 'teacher exercise visible to student today path',
      role: 'teacher',
      ok: async () => {
        const teacherToken = roleTokens.teacher;
        const studentToken = roleTokens.student;
        if (!teacherToken || !studentToken) {
          if (strictMode || !allowSkip) {
            throw new Error('teacher or student token unavailable');
          }
          printStatus('warn', 'teacher or student token unavailable, skip');
          return;
        }

        const before = await request({
          method: 'GET',
          path: '/api/v1/student/today-path',
          token: studentToken,
          expectStatus: 200
        });
        ensure(before.ok, `http ${before.status}`);
        ensure(hasJsonSuccess(before.payload), 'student today response success=false');
        const studentId = `${before.payload?.data?.studentId || ''}`.trim();
        ensure(studentId, 'student id missing');

        const title = `Phase2练习下发-${Date.now()}`;
        const assigned = await request({
          method: 'POST',
          path: `/api/v1/teacher/student/${encodeURIComponent(studentId)}/exercise`,
          token: teacherToken,
          body: {
            title,
            tasks: ['完成 3 句跟读', '整理 5 个关键词'],
            lessonId: 'smoke-lesson',
            topic: 'Phase2 练习下发验收',
            difficulty: 'medium'
          },
          expectStatus: 200
        });
        ensure(assigned.ok, `http ${assigned.status}`);
        ensure(hasJsonSuccess(assigned.payload), 'assign exercise response success=false');
        ensure(assigned.payload?.data?.task?.title === title, 'assigned exercise title mismatch');

        const after = await request({
          method: 'GET',
          path: '/api/v1/student/today-path',
          token: studentToken,
          expectStatus: 200
        });
        ensure(after.ok, `http ${after.status}`);
        ensure(hasJsonSuccess(after.payload), 'student today response success=false');
        const tasks = after.payload?.data?.tasks || [];
        ensure(Array.isArray(tasks), 'student today tasks missing array');
        ensure(
          tasks.some((item) => `${item.title || ''}`.trim() === title && `${item.taskType || item.task_type || ''}`.trim() === 'exercise'),
          'student today path missing assigned exercise'
        );
      }
    },
    {
      name: 'student today path',
      role: 'student',
      ok: async () => {
        const token = roleTokens.student;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('student token unavailable');
          }
          printStatus('warn', 'student token unavailable, skip');
          return;
        }
        const todayPath = await request({
          method: 'GET',
          path: '/api/v1/student/today-path',
          token,
          expectStatus: 200
        });
        ensure(todayPath.ok, `http ${todayPath.status}`);
        ensure(hasJsonSuccess(todayPath.payload), 'response success=false');
      }
    },
    {
      name: 'student path completion persists review history',
      role: 'student',
      ok: async () => {
        const token = roleTokens.student;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('student token unavailable');
          }
          printStatus('warn', 'student token unavailable, skip');
          return;
        }

        const today = await request({
          method: 'GET',
          path: '/api/v1/student/today-path',
          token,
          expectStatus: 200
        });
        ensure(today.ok, `http ${today.status}`);
        ensure(hasJsonSuccess(today.payload), 'student today response success=false');
        const studentId = `${today.payload?.data?.studentId || ''}`.trim();
        ensure(studentId, 'student id missing');

        const pathId = `path-${Date.now()}`;
        const pathTitle = `Phase2路径完成-${Date.now()}`;
        const submitted = await request({
          method: 'POST',
          path: '/api/v1/student/review/submit',
          token,
          body: {
            taskType: 'path_completion',
            title: pathTitle,
            answer: '已完成今日学习路径',
            score: 100,
            status: 'done',
            payload: {
              pathId,
              pathTitle,
              source: 'student_home_path'
            }
          },
          expectStatus: 200
        });
        ensure(submitted.ok, `http ${submitted.status}`);
        ensure(hasJsonSuccess(submitted.payload), 'path submit response success=false');

        const history = await request({
          method: 'GET',
          path: '/api/v1/student/review/history?limit=20',
          token,
          expectStatus: 200
        });
        ensure(history.ok, `http ${history.status}`);
        ensure(hasJsonSuccess(history.payload), 'student review history response success=false');
        const historyItems = history.payload?.data?.items || [];
        ensure(
          historyItems.some((item) => `${item.title || ''}`.trim() === pathTitle && `${item.taskType || item.task_type || ''}`.trim() === 'path_completion'),
          'student review history missing path completion'
        );

        const after = await request({
          method: 'GET',
          path: '/api/v1/student/today-path',
          token,
          expectStatus: 200
        });
        ensure(after.ok, `http ${after.status}`);
        ensure(hasJsonSuccess(after.payload), 'student today response success=false');
        const tasks = after.payload?.data?.tasks || [];
        ensure(
          tasks.some((item) => `${item.title || ''}`.trim() === pathTitle && `${item.taskType || item.task_type || ''}`.trim() === 'path_completion'),
          'student today path missing submitted path completion'
        );
      }
    },
    {
      name: 'authorization: student should be forbidden for admin institutions',
      role: 'student',
      ok: async () => {
        const token = roleTokens.student;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('student token unavailable');
          }
          printStatus('warn', 'student token unavailable, skip');
          return;
        }
        const forbidden = await request({
          method: 'GET',
          path: '/api/v1/admin/institutions',
          token,
          expectStatus: [401, 403]
        });
        ensure(forbidden.ok, `http ${forbidden.status}`);
      }
    }
  ];

  const institutionChecks = [
    {
      name: 'institution leads list',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const leads = await request({
          method: 'GET',
          path: '/api/v1/institution/leads?institutionId=inst-star&limit=5',
          token,
          expectStatus: 200
        });
        ensure(leads.ok, `http ${leads.status}`);
        ensure(hasJsonSuccess(leads.payload), 'response success=false');
        ensure(Array.isArray(leads.payload?.data?.leads), 'leads missing array');
      }
    },
    {
      name: 'institution lessons list',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const lessons = await request({
          method: 'GET',
          path: '/api/v1/institution/lessons?institutionId=inst-star&limit=5',
          token,
          expectStatus: 200
        });
        ensure(lessons.ok, `http ${lessons.status}`);
        ensure(hasJsonSuccess(lessons.payload), 'response success=false');
        ensure(Array.isArray(lessons.payload?.data?.lessons), 'lessons missing array');
      }
    },
    {
      name: 'institution students list',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const students = await request({
          method: 'GET',
          path: '/api/v1/institution/students?institutionId=inst-star&limit=5',
          token,
          expectStatus: 200
        });
        ensure(students.ok, `http ${students.status}`);
        ensure(hasJsonSuccess(students.payload), 'response success=false');
        ensure(Array.isArray(students.payload?.data?.students), 'students missing array');
      }
    },
    {
      name: 'institution teachers list',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const teachers = await request({
          method: 'GET',
          path: '/api/v1/institution/teachers?institutionId=inst-star&limit=5',
          token,
          expectStatus: 200
        });
        ensure(teachers.ok, `http ${teachers.status}`);
        ensure(hasJsonSuccess(teachers.payload), 'response success=false');
        ensure(Array.isArray(teachers.payload?.data?.teachers), 'teachers missing array');
      }
    },
    {
      name: 'institution payments list',
      role: 'founder',
      ok: async () => {
        const token = roleTokens.founder;
        if (!token) {
          if (strictMode || !allowSkip) {
            throw new Error('founder token unavailable');
          }
          printStatus('warn', 'founder token unavailable, skip');
          return;
        }
        const payments = await request({
          method: 'GET',
          path: '/api/v1/institution/payments?institutionId=inst-star&limit=5',
          token,
          expectStatus: 200
        });
        ensure(payments.ok, `http ${payments.status}`);
        ensure(hasJsonSuccess(payments.payload), 'response success=false');
        ensure(Array.isArray(payments.payload?.data?.payments), 'payments missing array');
      }
    }
  ];

  const checks = [...publicChecks, ...authChecks, ...institutionChecks];
  for (const item of checks) {
    const start = Date.now();
    total += 1;
    const ok = await runWithResult(item.name, item.ok);
    const elapsed = Date.now() - start;
    checkDetails.push({ name: item.name, role: item.role || 'public', ok, elapsedMs: elapsed });
    if (item.role && !roleTokens[item.role] && !strictMode && allowSkip) {
      skipped.push(item.name);
    }
    if (!ok) {
      fails.push(item.name);
    } else {
      passed += 1;
    }
  }

  if (fails.length) {
    printStatus('fail', `Smoke check failed: ${passed}/${total} passed`, `(failed: ${fails.join('; ')})`);
    process.exit(1);
  }

  printStatus('ok', `Smoke check passed: ${passed}/${total} checks`);
  printStatus(
    'ok',
    `Smoke meta`,
    `start=${startedAt} strictAuth=${strictMode} allowSkip=${allowSkip} tokenSources=${roleList
      .map((role) => `${role}:${tokenSources[role] || 'demo-login'}`)
      .join(',')}`
  );
  checkDetails
    .sort((a, b) => b.elapsedMs - a.elapsedMs)
    .slice(0, 3)
    .forEach((item) => {
      printStatus('ok', `Slowest check`, `${item.name} role=${item.role} ${item.elapsedMs}ms`);
    });
  if (skipped.length) {
    printStatus('warn', `Skipped checks in non-strict mode`, `${skipped.join('; ')}`);
  }
}

runPhase2Smoke().catch((error) => {
  printStatus('fail', 'Smoke check crashed', `(${error.message})`);
  process.exit(1);
});
