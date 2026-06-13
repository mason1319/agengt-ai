# Unified Media Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge admissions posters and culture wall media into one placement-aware media pipeline so the home page, student/parent entry points, and culture wall all render from the same backend data and can be updated without code changes.

**Architecture:** Keep the current `culture_wall_assets` table and `/api/v1/admin/culture-wall` route as the storage and delivery spine, but extend the payload shape with `placement`, `tags`, and `sortOrder` so the same endpoint can serve admissions posters and culture wall media. Add `mediaLibrary` as a first-class runtime shape in both the frontend bootstrap path and the shared function bootstrap path, then refactor the duplicated home admission sections and culture wall upload/listing views to consume filtered slices from that unified source. Preserve the legacy `cultureWall` structure as a compatibility view and fallback only.

**Tech Stack:** React 19, Vite, Cloudflare Workers functions, D1, R2, SQLite JSON payloads, existing smoke checks, browser preview verification.

---

### Task 1: Add a placement-aware media library shape to shared seed and runtime data

**Files:**
- Modify: `src/seedData.js`
- Modify: `functions/api/v1/_shared/seedData.js`
- Modify: `src/services/runtimeDataService.js`
- Modify: `functions/api/v1/_shared/runtimeData.js`
- Modify: `scripts/smoke-check.mjs`

- [ ] **Step 1: Write the failing smoke assertion**

Add a new smoke case near the existing culture wall checks so the suite fails until placement-aware filtering exists:

```js
const admissionsWall = await request({
  method: 'GET',
  path: '/api/v1/admin/culture-wall?placement=admissions',
  token: roleTokens.founder,
  expectStatus: 200
});

ensure(hasJsonSuccess(admissionsWall.payload), 'admissions placement response must succeed');
ensure(Array.isArray(admissionsWall.payload?.data?.cultureWall?.photos), 'admissions photos missing');
ensure(
  admissionsWall.payload.data.cultureWall.photos.every((item) => `${item.placement || ''}`.trim() === 'admissions'),
  'admissions placement leaked non-admissions assets'
);
```

- [ ] **Step 2: Run the smoke suite and confirm the failure**

Run:

```bash
npm run verify:smoke
```

Expected: the new admissions placement assertion fails before the data model is in place.

- [ ] **Step 3: Introduce `mediaLibrary` as the source of truth in seed data**

Move the current four admissions poster objects and the current culture wall photo/video objects into one `mediaLibrary.assets` list. Reuse the exact existing copy, URLs, tags, uploader, and cover art that already live in the repo today. Add `placement`, `kind`, `mediaUrl`, `coverUrl`, `sortOrder`, `status`, `category`, and `badge` to the admissions items, then derive the legacy `cultureWall` slices from that list.

```js
export const cultureWall = {
  videos: mediaLibrary.assets.filter((item) => item.placement === 'culture-wall' && item.kind === 'video'),
  photos: mediaLibrary.assets.filter((item) => item.placement === 'culture-wall' && item.kind === 'photo')
};
```

Keep the existing demo teachers and feedback arrays untouched and append them beside the derived media slices.

- [ ] **Step 4: Expose `mediaLibrary` from both runtime loaders**

In `src/services/runtimeDataService.js` and `functions/api/v1/_shared/runtimeData.js`, normalize bootstrap payloads so they return both:

```js
{
  mediaLibrary: { assets: mediaLibrary.assets.map((asset) => ({ ...asset })) },
  cultureWall: {
    videos: cultureWall.videos.map((item) => ({ ...item })),
    photos: cultureWall.photos.map((item) => ({ ...item })),
    teachers: cultureWall.teachers.map((item) => ({ ...item })),
    feedback: cultureWall.feedback.map((item) => ({ ...item }))
  }
}
```

Keep `cultureWall` as the compatibility shape for the current UI while the refactor lands.

- [ ] **Step 5: Run build and smoke again**

Run:

```bash
npm run build
npm run verify:smoke
```

Expected: build passes and the new smoke assertion still fails until Task 2 lands.

- [ ] **Step 6: Commit the data-shape work**

Commit message:

```bash
git add src/seedData.js functions/api/v1/_shared/seedData.js src/services/runtimeDataService.js functions/api/v1/_shared/runtimeData.js scripts/smoke-check.mjs
git commit -m "feat: add unified media library runtime shape"
```

---

### Task 2: Extend the culture wall API to store and filter placement metadata

**Files:**
- Modify: `functions/api/v1/_shared/dbLayer.js`
- Modify: `functions/api/v1/admin/culture-wall.js`
- Modify: `vite.config.js`
- Modify: `docs/openapi-v4.1.yaml`

- [ ] **Step 1: Add the placement contract to the smoke path**

Before changing the route, keep the same admissions smoke case from Task 1 and verify it fails because `placement` is ignored in both the dev mock and the Worker route.

- [ ] **Step 2: Run the integration stack and confirm the route still ignores placement**

Run:

```bash
npm run stack:verify
```

Expected: the route continues to return the old unfiltered culture wall shape until the backend changes land.

- [ ] **Step 3: Store placement and sort order inside the existing payload JSON**

Use the current `payload` column instead of adding a schema migration. That keeps the change localized and avoids breaking the existing table layout.

Add to `insertCultureWallAssetRaw`:

```js
const payloadText = JSON.stringify({
  placement: `${payload.placement || 'culture-wall'}`.trim(),
  sortOrder: Number(payload.sortOrder || 0),
  tags: Array.isArray(payload.tags) ? payload.tags : [],
  extra: payload.extra || {}
});
```

Update `normalizeCultureWallRow` to expose:

```js
placement: `${payload?.placement || 'culture-wall'}`.trim(),
sortOrder: Number(payload?.sortOrder || 0),
tags: Array.isArray(payload?.tags) ? payload.tags : []
```

Update `fetchCultureWallAssetsByInstitutionRaw` so it can filter by `placement` and `kind`, ordered by `sortOrder` first and `created_at` second.

- [ ] **Step 4: Accept `placement` in GET and POST**

In `functions/api/v1/admin/culture-wall.js`:

- read `placement` from the query string on GET
- read `placement`, `tags`, and `sortOrder` from multipart form data on POST
- default old uploads to `placement = culture-wall`
- let admissions uploads use the same endpoint by posting `placement = admissions`

Mirror the same behavior in `vite.config.js` so local dev and deployed Workers behave the same.

- [ ] **Step 5: Update the API contract docs**

In `docs/openapi-v4.1.yaml`, add `placement` as a query parameter on `GET /api/v1/admin/culture-wall` and as a multipart field on the upload body. Keep the route name unchanged so the existing UI mapping remains valid.

- [ ] **Step 6: Rerun the stack checks**

Run:

```bash
npm run validate:contracts
npm run stack:verify
```

Expected: the admissions placement smoke check passes and the route returns placement-filtered assets.

- [ ] **Step 7: Commit the API work**

Commit message:

```bash
git add functions/api/v1/_shared/dbLayer.js functions/api/v1/admin/culture-wall.js vite.config.js docs/openapi-v4.1.yaml
git commit -m "feat: make culture wall placement-aware"
```

---

### Task 3: Refactor the duplicated admission posters to read from the unified media library

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css` only if the shared admission view needs spacing or selector tweaks

- [ ] **Step 1: Replace the hardcoded poster array with a filtered media slice**

Remove `ADMISSION_POSTERS` as the primary data source and replace it with a placement filter over `runtimeData.mediaLibrary.assets`.

The shared selector should look like this:

```js
const visibleAdmissionMedia = useMemo(
  () => mediaLibraryAssets
    .filter((item) => `${item.placement || ''}`.trim() === 'admissions' && `${item.kind || ''}`.trim() === 'photo' && `${item.status || 'published'}` !== 'archived')
    .filter((item) => admissionFilter === 'all' || `${item.category || ''}`.trim() === admissionFilter)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
  [mediaLibraryAssets, admissionFilter]
);
```

Keep the existing drawer, consult prefill, and filter chip behavior intact.

- [ ] **Step 2: Make the home page and student-home branch use the same presenter**

Extract one local presenter in `src/main.jsx` so both duplicated home branches render the same admissions wall logic instead of copying the array/filter/drawer code twice.

The presenter must still support:

- filter chips
- preview image click
- detail drawer
- `handleJumpToConsult`

- [ ] **Step 3: Run the frontend build**

Run:

```bash
npm run build
```

Expected: build succeeds with the old poster constants removed.

- [ ] **Step 4: Inspect both entry points in the browser**

Run the local preview and verify these routes:

- home page admissions section
- student-facing home page admissions section

Check that the four admissions cards come from the unified library, the detail drawer still opens, and the consult button still pre-fills the form.

- [ ] **Step 5: Commit the home refactor**

Commit message:

```bash
git add src/main.jsx src/styles.css
git commit -m "feat: read admissions posters from unified media library"
```

---

### Task 4: Refactor culture wall upload/rendering and sync docs

**Files:**
- Modify: `src/main.jsx`
- Modify: `docs/ui-control-api-field-map.csv`
- Modify: `docs/ui-control-api-field-map-home-courses-practice-profile-v4.1-CN.md`
- Modify: `docs/unclosed-ui-controls-v4.1-internal-CN.md`
- Modify: `README.md`

- [ ] **Step 1: Add placement to the culture wall upload flow**

Update `CultureWallSection` and `CultureWallPage` so uploads can target either `admissions` or `culture-wall` while keeping the existing image/video upload buttons.

Concrete behavior:

- default culture wall uploads stay on `placement = culture-wall`
- the same upload path can create admissions photos by posting `placement = admissions`
- retry behavior still preserves the selected file and kind

- [ ] **Step 2: Rewire the culture wall views to read the unified library**

Use the unified asset slice for:

- the spotlight card
- the photo grid
- the video grid
- the summary counts

Keep `teachers` and `feedback` as independent legacy blocks.

- [ ] **Step 3: Update the docs that describe the API and the residual control list**

Update the CSV and markdown docs so they describe:

- the `placement` field on upload
- the `placement` query on read
- the fact that admissions posters and culture wall media now share one backend source
- the current residual list no longer treats the admission wall as a fixed-file dependency

Also update `README.md` so the culture wall section no longer says the feature is backed only by `src/seedData.js` demo arrays.

- [ ] **Step 4: Run the final verification set**

Run:

```bash
npm run validate:contracts
npm run build
npm run verify:smoke
```

Then open the local preview and confirm:

- admissions cards still render
- culture wall photos and videos still render
- uploading a new asset lands in the right placement
- archived assets disappear from both consumers

- [ ] **Step 5: Commit the UI and docs work**

Commit message:

```bash
git add src/main.jsx docs/ui-control-api-field-map.csv docs/ui-control-api-field-map-home-courses-practice-profile-v4.1-CN.md docs/unclosed-ui-controls-v4.1-internal-CN.md README.md
git commit -m "feat: unify admissions and culture wall media"
```

---

### Task 5: Final pass and release readiness

**Files:**
- Review: all files touched in Tasks 1-4

- [ ] **Step 1: Run the full verification set one more time**

Run:

```bash
npm run validate:contracts
npm run stack:verify
npm run build
```

- [ ] **Step 2: Confirm the browser surfaces**

Open the local app and check:

- admissions section on home
- admissions section on student-home
- culture wall page
- upload retry path

- [ ] **Step 3: Prepare the release note**

Summarize the behavior change as:

- fixed poster assets are replaced by a placement-aware media library
- admissions and culture wall now share the same upload and read path
- legacy fallbacks remain only for cold start and empty data
