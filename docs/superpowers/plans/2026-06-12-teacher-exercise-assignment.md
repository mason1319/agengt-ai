# Teacher Exercise Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers sync AI-generated exercises into `student_tasks` so students can read them from `/api/v1/student/today-path`.

**Architecture:** Add a focused teacher exercise endpoint that validates teacher-student ownership and writes `task_type=exercise` into the existing `student_tasks` table. Wire the teacher workspace to call the endpoint after AI generation, then verify with a smoke test that a student reads the same task.

**Tech Stack:** Cloudflare Pages Functions, D1, React/Vite, existing `runtimeDataService`, existing smoke-check script.

---

## File Structure

- Modify `scripts/smoke-check.mjs`: add the failing end-to-end smoke check.
- Create `functions/api/v1/teacher/student/[studentId]/exercise.js`: teacher exercise assignment endpoint.
- Modify `src/services/runtimeDataService.js`: add `assignTeacherExercise`.
- Modify `src/main.jsx`: call `assignTeacherExercise` from `runAgentExercise`.
- Modify `docs/ui-control-api-field-map.csv`: map the new API.
- Modify `docs/phase2-priority-backlog-v4.1-internal-CN.md`: record P1-2 progress.
- Modify `docs/phase2-daily-log-v4.1-internal-CN.md`: record verification.

---

### Task 1: Smoke Test First

**Files:**
- Modify: `scripts/smoke-check.mjs`

- [ ] **Step 1: Add failing smoke check**

Add a check named `teacher exercise visible to student today path` after `teacher feedback visible to parent summary`:

```js
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
}
```

- [ ] **Step 2: Run red test**

Run:

```bash
npm test
```

Expected: fail with `teacher exercise visible to student today path` because `/api/v1/teacher/student/{studentId}/exercise` does not exist.

---

### Task 2: Backend Endpoint

**Files:**
- Create: `functions/api/v1/teacher/student/[studentId]/exercise.js`

- [ ] **Step 1: Implement endpoint**

Create the file:

```js
import {
  apiSuccess,
  apiError,
  buildApiContext,
  parseJsonBody
} from '../../../_shared/phase1Api.js';
import {
  fetchStudentById,
  insertStudentTaskReview
} from '../../../_shared/dbLayer.js';
import { parseAuthContext } from '../../../_shared/runtimeData.js';

const STR = (value = '') => `${value || ''}`.trim();

function normalizeTasks(value) {
  if (Array.isArray(value)) {
    return value.map((item) => STR(item)).filter(Boolean).slice(0, 20);
  }
  const single = STR(value);
  return single ? [single] : [];
}

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
  const role = STR(auth?.role).toLowerCase();
  if (!['teacher', 'founder', 'platform'].includes(role)) {
    return apiError('No permission', 403, 403, ctx);
  }

  if (request.method !== 'POST') {
    return apiError('Method Not Allowed', 405, 405, ctx);
  }

  const studentId = STR(params?.studentId);
  if (!studentId) {
    return apiError('studentId required', 400, 400, ctx);
  }

  const parsed = new URL(request.url);
  const institutionId = STR(role === 'platform'
    ? parsed.searchParams.get('institutionId')
    : auth?.user?.institutionId);

  if (!institutionId) {
    return apiError('institutionId required', 400, 400, ctx);
  }

  const payload = await parseJsonBody(request);
  const tasks = normalizeTasks(payload?.tasks);
  const title = STR(payload?.title || payload?.topic || '课后练习');
  const lessonId = STR(payload?.lessonId);
  const topic = STR(payload?.topic);
  const difficulty = STR(payload?.difficulty || 'medium');

  if (!title && tasks.length === 0) {
    return apiError('title or tasks required', 400, 400, ctx);
  }

  const student = await fetchStudentById(env.DB, institutionId, studentId);
  if (!student) {
    return apiError('student not found', 404, 404, ctx);
  }

  if (role === 'teacher' && STR(student.teacherId) !== STR(auth?.user?.id)) {
    return apiError('No permission for this student', 403, 403, ctx);
  }

  const row = await insertStudentTaskReview(env.DB, {
    institutionId,
    studentId,
    taskType: 'exercise',
    title,
    answer: '',
    score: 0,
    status: 'pending',
    payload: {
      tasks,
      source: 'teacher_exercise',
      lessonId: lessonId || null,
      topic: topic || null,
      difficulty,
      generatedAt: new Date().toISOString(),
      sourceRole: role
    }
  });

  if (!row?.id) {
    return apiError('exercise assign failed', 500, 500, ctx);
  }

  return apiSuccess(
    {
      studentId,
      task: {
        id: row.id,
        taskType: row.taskType,
        title: row.title,
        status: row.status,
        payload: {
          tasks,
          lessonId,
          topic,
          difficulty
        }
      },
      createdAt: new Date().toISOString()
    },
    ctx
  );
}
```

- [ ] **Step 2: Run green smoke**

Run:

```bash
npm test
```

Expected: all checks pass, count increments by 1.

---

### Task 3: Frontend Service and Teacher Wiring

**Files:**
- Modify: `src/services/runtimeDataService.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Add service function**

Add an exported `assignTeacherExercise` near `submitTeacherIntervention`:

```js
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
```

- [ ] **Step 2: Wire teacher workspace**

In `src/main.jsx`:

1. Import `assignTeacherExercise`.
2. Add `onAssignExercise` prop to `TeacherWorkspace`.
3. In `runAgentExercise`, after normalizing output, call `onAssignExercise`.
4. Add App-level function:

```js
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
```

Pass `onAssignExercise={assignTeacherExerciseTask}` to `TeacherWorkspace`.

- [ ] **Step 3: Run tests**

Run:

```bash
npm test
npm run build
```

Expected: both pass.

---

### Task 4: Docs and Final Verification

**Files:**
- Modify: `docs/ui-control-api-field-map.csv`
- Modify: `docs/phase2-priority-backlog-v4.1-internal-CN.md`
- Modify: `docs/phase2-daily-log-v4.1-internal-CN.md`

- [ ] **Step 1: Update UI/API map**

Add:

```csv
POST,/api/v1/teacher/student/{studentId}/exercise,老师首页,teacher.workspace.exercise.sync,button,同步老师端AI练习题到学生今日任务,student_tasks,student_id;task_type;title;payload;status,是,submitting
```

- [ ] **Step 2: Update backlog and log**

Record that P1-2 now uses `student_tasks.task_type=exercise`, and list verification commands.

- [ ] **Step 3: Full verification**

Run:

```bash
npm run validate:contracts
npm test
npm run stack:verify
npm run build
npm run audit:deps
npm run audit:dead-code
npm run audit:security
```

Expected: all pass.

- [ ] **Step 4: Commit and open PR**

Run:

```bash
git add scripts/smoke-check.mjs functions/api/v1/teacher/student/[studentId]/exercise.js src/services/runtimeDataService.js src/main.jsx docs/ui-control-api-field-map.csv docs/phase2-priority-backlog-v4.1-internal-CN.md docs/phase2-daily-log-v4.1-internal-CN.md
git commit -m "feat: sync teacher exercises to student tasks"
git push -u origin codex/phase2-teacher-exercise
gh pr create --base main --head codex/phase2-teacher-exercise --draft --title "feat: sync teacher exercises to student tasks" --body "## Summary
- Add teacher exercise assignment API backed by student_tasks
- Wire teacher AI exercise generation to student today tasks
- Add smoke coverage for teacher exercise assignment -> student today-path

## Verification
- npm run validate:contracts
- npm test
- npm run stack:verify
- npm run build
- npm run audit:deps
- npm run audit:dead-code
- npm run audit:security"
```
