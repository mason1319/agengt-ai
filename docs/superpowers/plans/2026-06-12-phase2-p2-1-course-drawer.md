# Phase2 P2-1 Course Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a founder course create/edit drawer that saves through the existing course CRUD endpoints and refreshes the course lists.

**Architecture:** Keep the current course overview page and inject a drawer-based editor into the founder course workflow. Reuse the existing API route and D1 helpers; the only new state should be drawer mode, the selected course, and save/error state in the frontend.

**Tech Stack:** React/Vite frontend, Cloudflare Pages Functions, D1-backed course CRUD, Node smoke script.

---

## File Structure

- Modify `scripts/smoke-check.mjs` for create/update coverage.
- Modify `src/main.jsx` for the founder course drawer UI and save flow.
- Modify `src/services/runtimeDataService.js` if a service helper needs to expose create/update course operations already used by the app.
- Modify `docs/phase2-priority-backlog-v4.1-internal-CN.md` and `docs/phase2-daily-log-v4.1-internal-CN.md` after verification.

### Task 1: Add Failing Smoke for Course Drawer Create/Update

**Files:**
- Modify: `scripts/smoke-check.mjs`

- [ ] **Step 1: Add create-and-edit smoke**

Add a founder-authenticated smoke case that:

1. Reads the current founder course list.
2. Creates a new course through `POST /api/v1/founder/courses`.
3. Updates that course through `PATCH /api/v1/founder/courses`.
4. Verifies the updated `name`, `grade`, `classType`, and `priceCents` are returned by the API.

Example request body:

```js
{
  name: `P2-1 Smoke Course ${Date.now()}`,
  grade: '五年级',
  classType: 'small',
  schedule: '周三 19:00',
  startTime: '2026-06-12T19:00:00.000Z',
  durationMinutes: 90,
  capacity: 12,
  priceCents: 16800,
  status: 'active'
}
```

- [ ] **Step 2: Run smoke to verify RED**

Run:

```bash
bash ./scripts/smoke-check.sh
```

Expected: fail because the create/update smoke and drawer UI flow are not yet wired.

### Task 2: Implement Founder Drawer State and API Wiring

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/services/runtimeDataService.js`

- [ ] **Step 1: Add drawer state**

Add founder course drawer state for `mode`, `selectedCourse`, `draft`, `submitting`, and `errorMessage`.

- [ ] **Step 2: Add open/create/edit actions**

Open the drawer from `课程总览` with `新建课程`, and open it from a course row/card for editing.

- [ ] **Step 3: Wire save handlers**

On create, call the existing founder course create helper with the draft fields.

On edit, call the existing update helper with the current course id and edited fields.

- [ ] **Step 4: Refresh lists after save**

After a successful save, reload founder courses and public courses so the new or updated row is visible everywhere it already appears.

### Task 3: Render the Drawer UI

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Build the drawer**

Render a side drawer with inputs for:

```jsx
<input name="name" />
<input name="grade" />
<select name="classType" />
<textarea name="schedule" />
<input name="startTime" type="datetime-local" />
<input name="durationMinutes" type="number" />
<input name="capacity" type="number" />
<input name="priceCents" type="number" />
<select name="status" />
<input name="teacherId" />
<input name="imageUrl" />
```

- [ ] **Step 2: Show state and errors**

Keep the drawer open on failure and show the API error text in the footer.

- [ ] **Step 3: Keep list layout stable**

Do not replace the course overview; the drawer overlays or sits alongside it.

### Task 4: Verify and Document

**Files:**
- Modify: `docs/phase2-priority-backlog-v4.1-internal-CN.md`
- Modify: `docs/phase2-daily-log-v4.1-internal-CN.md`

- [ ] **Step 1: Run local gates**

Run:

```bash
npm run validate:contracts
npm run typecheck
npm run build
bash ./scripts/smoke-check.sh
```

- [ ] **Step 2: Commit**

```bash
git add scripts/smoke-check.mjs src/main.jsx src/services/runtimeDataService.js docs/phase2-priority-backlog-v4.1-internal-CN.md docs/phase2-daily-log-v4.1-internal-CN.md
git commit -m "feat: add founder course drawer"
```

- [ ] **Step 3: Merge and deploy**

Push the branch, open a PR, merge it, deploy through `npm run cf:deploy:ensure`, and rerun the smoke suite against preview and both production domains.

## Self-Review

- Spec coverage: create/edit drawer, API reuse, error handling, smoke, and docs are covered.
- Placeholder scan: no TBD or vague task text remains.
- Type consistency: field names match the existing founder course API and D1 schema.
