# 状态词收口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一课程、课时、缴费、到期和练习状态词，减少页面里仍然散落的“待确认/待更新/未排课”口径。

**Architecture:** 只动共享格式化函数和少量高频页面文案，不改业务数据流。先把课程相关 fallback 统一到一套常量，再把个人中心、创始人、老师端残留的时间/缴费/到期文案收口到同一套词表。

**Tech Stack:** React, Vite, existing formatters/utilities, markdown docs

---

### Task 1: Centralize fallback copy

**Files:**
- Modify: `src/utils/formatters.js`
- Modify: `src/utils/courseFormatters.js`

- [x] **Step 1: Update shared fallback strings**

```js
export const COURSE_COPY = {
  classTypeFallback: '班型待确认',
  feeFallback: '收费标准待确认',
  timeFallback: '时间待确认',
  courseNameFallback: '课程名称待确认',
  scheduleDateFallback: '上课日期待确认'
};
```

- [x] **Step 2: Wire formatter outputs to the shared copy**
- [x] **Step 3: Run `npm run typecheck` and `npm run build`**

### Task 2: Normalize remaining page-level state words

**Files:**
- Modify: `src/main.jsx`
- Modify: `docs/unclosed-ui-controls-v4.1-internal-CN.md`

- [x] **Step 1: Replace remaining `待更新` / `未排课` / `待录入` occurrences with the shared copy**
- [x] **Step 2: Keep real empty states untouched**
- [x] **Step 3: Mark the resolved items as closed in the checklist**
- [x] **Step 4: Run browser smoke on the student and founder views**

### Task 3: Verify and close out

**Files:**
- Modify: none

- [x] **Step 1: Re-run `npm run typecheck`**
- [x] **Step 2: Re-run `npm run build`**
- [x] **Step 3: Re-open the app and confirm the updated state words render**
- [x] **Step 4: Commit**
