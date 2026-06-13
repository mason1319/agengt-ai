# Platform Practice Read-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `platform.practice` into a read-only platform strategy page that shows trial, renewal, and freeze guidance without implying purchase or edit flows.

**Architecture:** Keep the change inside `src/main.jsx` and reuse existing org status metadata from `runtimeData`. Replace the current billing-plan presentation with a strategy summary surface that shows status cards, rules, and current org examples. Do not introduce a new route, table, or editable actions.

**Tech Stack:** React, existing design system classes, current runtime data service and config constants.

---

### Task 1: Replace the platform practice page content

**Files:**
- Modify: `src/main.jsx:3261-3295`

- [ ] **Step 1: Inspect the current platform practice page**

Confirm the page still renders billing-plan cards and only shows read-only helper text.

- [ ] **Step 2: Implement the read-only strategy layout**

```jsx
function PlatformPlansPage({ organizations = [], orgStatusDefaults = {}, orgActionsByStatus = {} }) {
  return (
    <section className="role-grid">
      <div className="panel wide">
        <PanelTitle icon={CreditCard} title="机构策略总览" />
        <div className="summary-grid">
          {Object.entries(orgStatusDefaults).map(([status, defaults]) => (
            <article className="summary-card" key={status}>
              <strong>{status}</strong>
              <span>{defaults.planMode || '月付'}</span>
              <small>{defaults.expiryAction || '到期后只读'}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="panel">
        <PanelTitle icon={Rocket} title="状态规则" />
        <ul className="check-list">
          {Object.entries(orgActionsByStatus).map(([status, actions]) => (
            <li key={status}>
              <Check size={16} /> {status}：{actions.map((action) => action.label).join(' / ')}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire the page to runtime org metadata**

Pass `runtimeData.orgStatusDefaults` and `runtimeData.orgActionsByStatus` from the platform route.

- [ ] **Step 4: Run verification**

Run: `npm run typecheck && npm run build && npm run stack:verify`
Expected: all pass, smoke remains green.

### Task 2: Sync docs for the platform practice closure

**Files:**
- Modify: `docs/unclosed-ui-controls-v4.1-internal-CN.md`
- Modify: `docs/phase2-daily-log-v4.1-internal-CN.md`

- [ ] **Step 1: Mark `platform.practice` as read-only and closed**

Replace the open-item note with the read-only strategy summary state.

- [ ] **Step 2: Add a dated log entry**

Record that the platform practice page is intentionally read-only and shows status guidance only.

- [ ] **Step 3: Re-run the same verification commands**

Run: `npm run typecheck && npm run build && npm run stack:verify`
Expected: all pass.

