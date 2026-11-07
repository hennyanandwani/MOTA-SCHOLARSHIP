# Phase 6 AI, selection, approval, and audit handoff

## Synchronous integration boundary

The FastAPI source and OpenAPI document are not in this repository. The
service-owner-provided contract for integration is `POST /api/v1/verifications`,
token authentication, multipart `application_data`,
`criteria`, and `required_document_types` fields, with optional `document_types`
and repeated `documents`. The synchronous JSON response contains
`application_id`, `outcome`, `reasons`, and `documents`. Supported outcomes are
`ELIGIBLE`, `INELIGIBLE`, `NEEDS_REVIEW`, and `FAILED`. The backend consumes
idempotency keys even on failure; duplicate keys return HTTP 409 without
replaying a result.

The dispatcher projects `application_data` to only the fields referenced by
the stored policy criteria. Names, contact details, identity and certificate
numbers, addresses, and banking fields are excluded. It loads document IDs and
types for selection; the adapter independently reloads only selected files
within the application scope, and uses synthetic filenames.

The internal dispatcher foundation is exposed only at
`POST /api/internal/ai-verification/dispatch` and requires a server-side
`AI_VERIFICATION_DISPATCH_TOKEN` Bearer credential. It claims one current
`WAITING_FOR_CONFIGURATION` job at a time, reads criteria/document settings
from the job's immutable policy snapshot, and invokes the existing adapter.
The adapter pins the endpoint path to `/api/v1/verifications`, sends the
existing job idempotency key, and uploads only JPEG, PNG, or WebP files (up to
five files, 10 MiB each, and 20 megapixels each). Multipart filenames are
synthetic and do not include the stored original filename.

Synchronous results are persisted transactionally to the current fenced job
and application input version. Only actual `INELIGIBLE` results increment
`aiAttemptCount`; the first three permit document correction and resubmission,
while the fourth routes to Admin manual review without rejecting the
application. `NEEDS_REVIEW` is also routed to manual review, and `FAILED` is a
technical failure that does not increment the ineligibility count. `ELIGIBLE`
enters the existing manual review flow. Selection and approval continue to
require manual verification, and the separate Approver workflow remains
unchanged. Timeouts and HTTP 409 are not automatically retried.

The legacy callback endpoint is authenticated but disabled with HTTP 410.
Synchronous dispatch is the only supported source of AI result updates.
Existing `aiAttemptCount`, input-version, and job-history fields suffice; this
step requires no schema migration.

Before enabling production dispatch, operational owners must still confirm:

1. Production endpoint configuration, service token issuance/rotation, request
   limits, and hosting execution budget.
2. Service-side idempotency retention and how operators resolve ambiguous
   timeouts or consumed-key HTTP 409 conflicts without duplicate decisions.
3. Document retention, privacy controls, and authorization for the backend to
   process uploaded private files.
4. Exact eligibility semantics, extraction-result meanings, model/version
   metadata, confidence meaning, and the operational handling of
   `NEEDS_REVIEW`.
5. Dispatch rate limits, monitoring, retention, and incident-response
   requirements.

Never put service credentials in student/browser code, send public storage
paths, or treat a timeout as a negative eligibility result.

## Workflow semantics

- AI eligibility is necessary, but does not approve or select an applicant.
- Only AI-eligible applications enter document/manual verification.
- AI ineligibility sets `REJECTED_BY_AI` and stores a student-facing reason
  separately from internal explanation. Student text is chosen from a fixed
  reason-code map rather than showing raw AI explanation. A retry or
  reconsideration creates a new versioned job and requires Admin remarks;
  previous job outcomes remain.
- Selection is recorded independently of manual verification and requires an
  AI-eligible, manually verified recommendation and every attached document
  verified. No rank, score, quota, or priority policy is defined, so priority
  remains null.
- A `SELECTED` outcome creates an explicit pending-approval event. Only users
  with the separate `APPROVER` role can approve, return, or resubmit an
  approval. Existing `ADMIN` users do not implicitly gain approval authority.
- Sanction and payment are out of scope.

## Migration review and compatibility

`prisma/migrations/20261104130000_phase6_review_selection_ai/migration.sql` is
an additive, unexecuted migration. It adds enum values and new enums, nullable
AI result fields, defaulted workflow state/version/count fields, indexes,
versioned AI job history, and append-only selection, approval, and document
verification events. No existing application status or decision row is
rewritten. Existing applications receive `NOT_REQUESTED` AI and `NOT_READY`
manual-review defaults; historical AI/document/selection/approval results are
not inferred or backfilled. In particular, existing submitted or previously
recommended applications do not become AI-eligible automatically and will stay
out of the manual-review and selection queues until an explicitly configured
evaluation/reconsideration workflow processes them. Existing historical
officer decisions are retained.

Foreign keys on audit records use `RESTRICT` so referenced application,
document, or actor records cannot be removed after audit events exist. Database
triggers reject update/delete operations on document verification, selection,
and approval event tables. AI job rows are versioned; a retry creates another
row instead of overwriting a prior result.

Before approval to apply this migration:

1. Verify the migration history and target schema on a confirmed isolated
   non-production database.
2. Review PostgreSQL version support for `ALTER TYPE ... ADD VALUE` and execute
   migrations with the repository's normal migration runner only after
   explicit approval.
3. Generate Prisma Client from the reviewed schema and run isolated migration
   and route integration tests.
4. Verify row counts and legacy defaults, append-only triggers, actor
   constraints, and query plans on a restored non-production snapshot.

Rollback is intentionally not an automatic down migration: dropping enums,
columns, tables, or audit rows would destroy newly recorded workflow history.
If rollback is needed before any Phase 6 writes, first disable the new routes
and restore the previous application version; then prepare a separately
reviewed database rollback only after confirming the new tables are empty and
the new fields have no dependent records. Otherwise use a forward corrective
migration and retain audit data.
