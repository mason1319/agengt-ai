# Phase2 P1-4 Trial Booking Course Summary and Lead Convert Segments Design

## Goal

Close the P1-4 internal backlog item with a narrow, verifiable loop:

- Public trial bookings show and submit the selected public course.
- The trial booking API returns a course summary for the selected course.
- Founder lead conversion failures return staged results instead of one generic failure message.

## Scope

Included:

- Public course selection summary in the trial booking area.
- `POST /api/v1/public/trial-bookings` response field `courseSummary`.
- `POST /api/v1/founder/leads/{leadId}/convert` response field `segments`.
- Frontend rendering of conversion segment statuses after a conversion attempt.
- Smoke coverage for selected-course booking and segmented conversion failure.

Excluded:

- Public purchase.
- Online payment.
- Parent payment flow.
- Course package purchase.
- New commercial checkout pages.
- Login or permission model changes.

## Public Trial Booking Flow

The public home view already loads public courses and stores the selected course id. P1-4 keeps that structure and adds an explicit selected-course summary near the trial booking controls.

When a user submits a trial booking:

1. The frontend sends `courseId` with the booking request.
2. The backend validates the course can be found.
3. The booking is created with the existing persistence path.
4. The API response includes:

```json
{
  "booking": {},
  "leadId": "lead_123",
  "status": "scheduled",
  "courseSummary": {
    "id": "course_123",
    "title": "Aggie Phonics Starter",
    "gradeBand": "G1-G2",
    "classType": "small_group"
  }
}
```

The UI can use the local selected-course object for immediate display, while smoke tests use the API `courseSummary` as the durable contract.

## Founder Lead Convert Segments

The founder conversion API returns a segment array with stable stage keys:

- `student`
- `lessonAccount`
- `paymentRecord`
- `courseEnrollment`

Each segment has:

```json
{
  "stage": "courseEnrollment",
  "label": "课程报名",
  "status": "failed",
  "message": "课程不存在或不可报名"
}
```

Supported statuses:

- `success`
- `failed`
- `skipped`

For a preflight course failure, the API returns `converted: false` and marks earlier mutation stages as `skipped`. This avoids creating partial students, lesson accounts, or payment records during a predictable course validation failure.

Non-conversion fatal errors such as missing lead records still use the existing error response style.

## Frontend Behavior

Public view:

- When a course is selected, display a compact summary in the booking area.
- Keep copy in the consultation/trial vocabulary.
- Do not introduce purchase, order, or payment language.

Founder view:

- After a convert attempt, render each returned segment beside the lead action feedback.
- Show success, failed, and skipped states with the stage label and message.
- Keep the current list and action layout; no new route or modal is required.

## Smoke Coverage

Add smoke cases before implementation:

1. `public trial booking returns selected course summary`
   - Fetch public courses.
   - Create a public lead.
   - Submit a trial booking with `courseId`.
   - Assert response `courseSummary.id` equals submitted `courseId`.

2. `founder lead convert returns segmented course enrollment failure`
   - Create a lead.
   - Convert it with an invalid `courseId`.
   - Assert `converted === false`.
   - Assert `segments` exists.
   - Assert `courseEnrollment.status === "failed"`.
   - Assert `student`, `lessonAccount`, and `paymentRecord` are `skipped`.

## Rollout

After local verification:

1. Commit implementation.
2. Push branch and open PR.
3. Merge PR after checks.
4. Deploy through the existing Cloudflare Pages command.
5. Run smoke against the preview URL, `https://aggieai.me`, and `https://www.aggieai.me`.
6. Record deployment evidence in the project docs.
