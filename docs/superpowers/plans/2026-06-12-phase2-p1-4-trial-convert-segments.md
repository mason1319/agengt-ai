# Phase2 P1-4 Trial Convert Segments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selected-course summaries to public trial bookings and staged failure reporting to founder lead conversion.

**Architecture:** Keep the existing API and large frontend entrypoint structure. Add durable API contracts first through smoke checks, then implement the smallest backend and UI changes needed to satisfy them.

**Tech Stack:** Vite/React frontend, Cloudflare Pages Functions, D1-backed data helpers, Node smoke script.

---

## File Structure

- Modify `scripts/smoke-check.mjs` for two P1-4 acceptance cases.
- Modify `functions/api/v1/public/trial-bookings.js` to return `courseSummary`.
- Modify `functions/api/v1/founder/leads/[leadId]/convert.js` to return conversion `segments`.
- Modify `src/services/runtimeDataService.js` to preserve new response fields.
- Modify `src/main.jsx` to render public course summary and founder conversion segments.
- Modify `docs/phase2-priority-backlog-v4.1-internal-CN.md` after verification.

### Task 1: Add Failing Smoke for Public Trial Course Summary

**Files:**
- Modify: `scripts/smoke-check.mjs`

- [ ] **Step 1: Add smoke assertion**

Add a smoke case that creates a public lead, submits a trial booking with a public course id, and asserts `courseSummary.id` equals the submitted id.

- [ ] **Step 2: Run smoke to verify RED**

Run:

```bash
bash ./scripts/smoke-check.sh
```

Expected: fail on missing `courseSummary`.

- [ ] **Step 3: Commit smoke RED if needed**

Do not commit a permanently failing test alone unless execution pauses. Prefer implementing in the same feature commit after RED is observed.

### Task 2: Implement Trial Booking Course Summary

**Files:**
- Modify: `functions/api/v1/public/trial-bookings.js`
- Modify: `src/services/runtimeDataService.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Return `courseSummary` from the API**

Look up the submitted course and return a compact summary with id, title/name, grade band, class type, and schedule or price fields when present.

- [ ] **Step 2: Render selected course summary**

In the public trial booking area, derive the selected course from `selectedPublicCourseId` and `publicCourseList`, then show the existing course-facing fields without purchase or payment wording.

- [ ] **Step 3: Run smoke to verify GREEN**

Run:

```bash
bash ./scripts/smoke-check.sh
```

Expected: the public trial booking course summary case passes.

### Task 3: Add Failing Smoke for Segmented Convert Failure

**Files:**
- Modify: `scripts/smoke-check.mjs`

- [ ] **Step 1: Add invalid-course conversion smoke**

Create a public lead, call founder conversion with an invalid `courseId`, and assert the response includes `converted: false` and a failed `courseEnrollment` segment.

- [ ] **Step 2: Run smoke to verify RED**

Run:

```bash
bash ./scripts/smoke-check.sh
```

Expected: fail because the API does not yet return staged conversion segments.

### Task 4: Implement Founder Convert Segments

**Files:**
- Modify: `functions/api/v1/founder/leads/[leadId]/convert.js`
- Modify: `src/services/runtimeDataService.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Add segment helpers**

Create stable stage keys and labels for `student`, `lessonAccount`, `paymentRecord`, and `courseEnrollment`.

- [ ] **Step 2: Add course preflight failure**

When `courseId` is supplied but no matching course exists, return `converted: false` with skipped mutation stages and failed `courseEnrollment`.

- [ ] **Step 3: Add success segments**

For successful conversion, return `converted: true` with success/skipped segments matching actual work.

- [ ] **Step 4: Render segment statuses**

After founder conversion, show the returned segment labels, statuses, and messages in the lead row action area.

- [ ] **Step 5: Run smoke to verify GREEN**

Run:

```bash
bash ./scripts/smoke-check.sh
```

Expected: all P1-4 smoke cases pass.

### Task 5: Full Verification and Deployment

**Files:**
- Modify: `docs/phase2-priority-backlog-v4.1-internal-CN.md`
- Modify: deployment evidence doc if present for current phase.

- [ ] **Step 1: Run local quality gates**

Run available project commands:

```bash
npm run validate:contracts
npm run typecheck
npm run build
bash ./scripts/smoke-check.sh
```

- [ ] **Step 2: Commit implementation**

```bash
git add scripts/smoke-check.mjs functions/api/v1/public/trial-bookings.js functions/api/v1/founder/leads/[leadId]/convert.js src/services/runtimeDataService.js src/main.jsx docs/phase2-priority-backlog-v4.1-internal-CN.md
git commit -m "feat: segment lead conversion and trial course summary"
```

- [ ] **Step 3: Publish**

Push the branch, open a PR, merge it, deploy through the existing Cloudflare Pages deployment command, and run online smoke against preview plus both production domains.

## Self-Review

- Spec coverage: public course summary, segmented conversion failure, frontend rendering, and smoke verification are covered.
- Placeholder scan: no TBD or deferred implementation placeholders remain.
- Type consistency: stage keys and expected API fields match between spec and plan.
