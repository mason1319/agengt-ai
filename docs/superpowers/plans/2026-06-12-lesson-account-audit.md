# Lesson Account Audit Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make lesson account adjustments and attendance deductions auditable and visible through existing APIs.

**Architecture:** Keep the existing `lesson_accounts` table and use `notes` as the Phase 2 adjustment reason. Add smoke tests for reason enforcement and attendance deduction details, then enhance the teacher attendance response with before/after balance fields.

**Tech Stack:** Cloudflare Pages Functions, D1, React/Vite, existing `runtimeDataService`, smoke-check script.

---

## File Structure

- Modify `scripts/smoke-check.mjs`: add two failing smoke checks.
- Modify `functions/api/v1/teacher/courses/[courseId]/attendance.js`: return deduction detail after consume.
- Modify `src/main.jsx`: show deduction detail in teacher quick-close feedback.
- Modify `src/services/runtimeDataService.js`: demo fallback includes deduction details.
- Modify `docs/openapi-v4.1.yaml`: document response behavior in descriptions.
- Modify `docs/phase2-priority-backlog-v4.1-internal-CN.md`: mark P1-3 progress.
- Modify `docs/phase2-daily-log-v4.1-internal-CN.md`: record validation.

---

### Task 1: Smoke Tests First

**Files:**
- Modify: `scripts/smoke-check.mjs`

- [ ] **Step 1: Add founder reason enforcement smoke**

Add check after `founder reconciliation`:

```js
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
}
```

- [ ] **Step 2: Add attendance deduction detail smoke**

Add check after the reason check:

```js
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
}
```

- [ ] **Step 3: Run red test**

Run:

```bash
npm test
```

Expected: the reason check should pass with existing code, and `teacher attendance returns deduction detail` should fail because deduction fields are missing.

---

### Task 2: Backend Deduction Details

**Files:**
- Modify: `functions/api/v1/teacher/courses/[courseId]/attendance.js`

- [ ] **Step 1: Capture before and after balances**

Replace the consume section:

```js
const account = await fetchLatestLessonAccountByStudent(env.DB, studentId);
if (account?.id) {
  await consumeLessonAccount(env.DB, studentId, account.id, 1);
}

summary.lessons.push({ studentId, lesson, account });
```

with:

```js
const account = await fetchLatestLessonAccountByStudent(env.DB, studentId);
let deduction = {
  studentId,
  lesson,
  account,
  accountId: account?.id || '',
  hoursDeducted: 0,
  beforeRemaining: Number(account?.remaining_hours || account?.remainingHours || 0),
  afterRemaining: Number(account?.remaining_hours || account?.remainingHours || 0)
};
if (account?.id) {
  const consumedHours = await consumeLessonAccount(env.DB, studentId, account.id, 1);
  const updatedAccount = await fetchLatestLessonAccountByStudent(env.DB, studentId);
  deduction = {
    ...deduction,
    account: updatedAccount || account,
    hoursDeducted: Number(consumedHours || 0),
    afterRemaining: Number(updatedAccount?.remaining_hours || updatedAccount?.remainingHours || 0)
  };
}

summary.lessons.push(deduction);
```

- [ ] **Step 2: Run green test**

Run:

```bash
npm test
```

Expected: all smoke checks pass, count increments by 2 from prior baseline.

---

### Task 3: Frontend Teacher Feedback

**Files:**
- Modify: `src/services/runtimeDataService.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Update demo fallback summary**

In `submitTeacherAttendanceByCourse` demo fallback, make `summary.lessons` include:

```js
lessons: [
  {
    studentId: payload.studentId || '',
    hoursDeducted: 1,
    beforeRemaining: 10,
    afterRemaining: 9,
    accountId: 'mock-account'
  }
]
```

- [ ] **Step 2: Show quick close deduction message**

In `quickClose`, store the result from `onSubmitAttendance` and derive the first deduction:

```js
const result = await onSubmitAttendance?.(...);
const deduction = (result?.data?.summary?.lessons || []).find((item) => {
  return `${item.studentId || ''}`.trim() === `${currentStudent?.id || currentStudent?.studentId || currentLesson.studentId || currentLesson.student_id || ''}`.trim();
}) || (result?.data?.summary?.lessons || [])[0] || null;
const deductionText = deduction?.hoursDeducted
  ? `，扣减 ${deduction.hoursDeducted} 节，剩余 ${deduction.afterRemaining} 节`
  : '';
setTeacherMessage(`已提交点名：${attendanceStatus} / ${studentName}${deductionText}`);
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

---

### Task 4: Docs and Full Verification

**Files:**
- Modify: `docs/openapi-v4.1.yaml`
- Modify: `docs/phase2-priority-backlog-v4.1-internal-CN.md`
- Modify: `docs/phase2-daily-log-v4.1-internal-CN.md`

- [ ] **Step 1: Update OpenAPI descriptions**

Update teacher attendance response description to mention deduction detail, and founder lesson account POST description to mention reason enforcement.

- [ ] **Step 2: Update backlog and daily log**

Record P1-3 progress and verification results.

- [ ] **Step 3: Full verification**

Run:

```bash
npm run validate:contracts
npm test
npm run stack:verify
npm run build
npm run lint
npm run typecheck
npm run audit:deps
npm run audit:dead-code
npm run audit:security
```

Expected: all pass.

---

### Task 5: Commit, PR, Merge, Deploy

**Files:**
- All changed files.

- [ ] **Step 1: Commit implementation**

Run:

```bash
git add scripts/smoke-check.mjs functions/api/v1/teacher/courses/[courseId]/attendance.js src/services/runtimeDataService.js src/main.jsx docs/openapi-v4.1.yaml docs/phase2-priority-backlog-v4.1-internal-CN.md docs/phase2-daily-log-v4.1-internal-CN.md docs/superpowers/specs/2026-06-12-lesson-account-audit-design.md docs/superpowers/plans/2026-06-12-lesson-account-audit.md
git commit -m "feat: return lesson deduction audit details"
```

- [ ] **Step 2: Push and create PR**

Run:

```bash
git push -u origin codex/phase2-lesson-audit
gh pr create --base main --head codex/phase2-lesson-audit --draft --title "feat: return lesson deduction audit details" --body "## Summary
- Add smoke coverage for lesson account adjustment reason enforcement
- Return teacher attendance deduction details with before/after balances
- Show deduction detail in teacher quick-close feedback

## Verification
- npm run validate:contracts
- npm test
- npm run stack:verify
- npm run build
- npm run lint
- npm run typecheck
- npm run audit:deps
- npm run audit:dead-code
- npm run audit:security"
```

- [ ] **Step 3: Merge and deploy after PR is ready**

Run:

```bash
gh pr ready <PR_NUMBER>
gh pr merge <PR_NUMBER> --squash --delete-branch --subject "feat: return lesson deduction audit details" --body "Merge Phase 2 P1-3 lesson deduction details."
npm run cf:deploy:ensure
```

- [ ] **Step 4: Online smoke**

Run sequentially:

```bash
bash ./scripts/smoke-check.sh <new-pages-preview-url>
SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://aggieai.me
SMOKE_STRICT_AUTH=true SMOKE_ALLOW_SKIP=false bash ./scripts/smoke-check.sh https://www.aggieai.me
```

Expected: all pass.
