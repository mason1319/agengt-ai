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
    printStatus('fail', name, `(${error.message})`);
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

  const roleTokens = {};
  const roleList = ['platform', 'founder', 'teacher', 'parent', 'student'];

  for (const role of roleList) {
    const envToken = process.env[`STAGE2_TOKEN_${role.toUpperCase()}`] || process.env[`STARMATE_TOKEN_${role.toUpperCase()}`] || '';
    const token = await login(role, envToken);
    if (token) {
      roleTokens[role] = token;
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
    total += 1;
    const ok = await runWithResult(item.name, item.ok);
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
}

runPhase2Smoke().catch((error) => {
  printStatus('fail', 'Smoke check crashed', `(${error.message})`);
  process.exit(1);
});
