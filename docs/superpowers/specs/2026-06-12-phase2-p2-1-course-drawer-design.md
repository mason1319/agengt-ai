# Phase2 P2-1 Course Drawer Design

## Goal

Add a founder course create/edit drawer that reuses the existing course CRUD endpoints and keeps the current course overview intact.

## Scope

Included:

- Founder course create drawer.
- Founder course edit drawer.
- Reuse of existing `POST /api/v1/founder/courses` and `PATCH /api/v1/founder/courses`.
- Form fields limited to the course model already supported by the backend.
- Smoke coverage for create/update flow and list refresh.

Excluded:

- Pricing checkout.
- Enrollment purchase.
- New course schema fields.
- Bulk import/export.
- Teacher scheduling refactor.

## User Flow

On the founder course page:

1. The course overview list remains visible.
2. A `新建课程` button opens a drawer with blank fields.
3. Clicking an existing course opens the same drawer in edit mode.
4. Saving in create mode calls the existing create endpoint.
5. Saving in edit mode calls the existing patch endpoint with the course id.
6. The course list refreshes after save so the drawer result is immediately visible.

## Fields

The drawer uses only fields that already map to the course API and D1 schema:

- `name`
- `grade`
- `level`
- `classType`
- `schedule`
- `startTime`
- `durationMinutes`
- `capacity`
- `priceCents`
- `status`
- `teacherId`
- `imageUrl`

Field behavior:

- `name` is required.
- `durationMinutes` and `capacity` use numeric inputs.
- `priceCents` stores cents, not yuan.
- `status` defaults to `active`.
- `classType` uses the existing small-group / one-to-one style values already used in the app.

## API Behavior

Create:

- The drawer submits to `POST /api/v1/founder/courses`.
- The request body matches the existing route contract.
- On success, the returned `course` object is used to refresh the list and close the drawer.

Update:

- The drawer submits to `PATCH /api/v1/founder/courses`.
- The request body includes the current course id plus edited fields.
- On success, the returned `course` object replaces the edited row in local state.

## Error Handling

Validation and errors stay simple:

- Missing `name` blocks submit before the request.
- API failure keeps the drawer open.
- Error text shows in the drawer footer and does not clear the draft.

## Testing

Add smoke coverage for:

- Creating a new course from the founder page.
- Editing the newly created course and verifying the updated fields are visible in the list.
- Confirming the public course list also reflects the new or updated course after refresh.

## Rollout

After the implementation lands:

1. Commit feature changes.
2. Merge the PR.
3. Deploy to Cloudflare Pages.
4. Re-run the existing smoke suite plus the new course-drawer case.
