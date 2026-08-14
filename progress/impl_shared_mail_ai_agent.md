# Implementation Report - shared_mail_ai_agent

Status: in_progress

## Implemented

- Added an administrator-only shared mail workspace under `/dashboard/email`.
- Added compact Inbox, Sent, Archive, safe custom folders, search, thread,
  message, compose, reply, reply-all, forward, flag, real IMAP folder moves,
  archive, attachment, settings, memory, and rule UI.
- Added collapsible custom folders, a three-dot move/archive menu on each
  movable list item, and visible-thread selection with bulk move, archive, and
  restore actions. Moves refresh the current view without redirecting.
- Bulk folder changes reuse one IMAP connection, validate at most 50 unique
  threads, audit each thread, and prepare a conventional Archive folder when
  Hostinger does not advertise one.
- Added resumable bounded Hostinger IMAP import and sync with a shared lease,
  folder cursors, UID plus Message-ID dedupe, three-month import, large-message
  handoff, and new-follow-up queue cancellation.
- Added SMTP delivery with pre-send persistence, sent or failed audit state,
  MIME copy to Hostinger Sent, and safe 4 MB attachment handling.
- Added an OpenAI Responses workflow using `gpt-5.6-terra`, structured high
  triage and draft, xhigh escalation for complexity, store false, and hashed
  safety identifiers.
- Added approved-memory and prior-sent retrieval, bounded historical embedding,
  pending memory review, feedback, exact and pgvector rule matching, protected
  literals, safety gates, sending windows, queue leases, and a default-off
  global switch.
- Added the bearer-protected cron endpoint and made only that path bypass the
  session proxy so cron-job.org receives a real 401 or service response.

## Persistence

- Additive migration created for 13 Mail tables plus pg_trgm, vector, trigram
  indexes, and HNSW cosine indexes.
- Migration `57d8b5d1-ab46-4f78-b2ac-29fc17e64230` passed in temporary branch
  `br-snowy-forest-ac5f7u9o`; production remains unchanged pending approval.

## Verification

- Focused mail-agent check: passed.
- Prisma validation: passed.
- TypeScript: passed.
- ESLint: passed.
- Direct Next production build: passed with all 26 pages and both mail APIs.
- Authenticated desktop and mobile smoke: safe restart or migration state
  passed; imported mailbox flows await credentials and migration promotion.
- Authenticated mailbox UX smoke: collapse, quick menu, two-thread bulk
  selection, Archive destination, 390-by-844 no-overflow, and zero console
  errors passed without moving live mail.

## Remaining

- Explicitly promote or discard the tested Neon migration.
- Configure Hostinger and cron secrets.
- Restart the user-owned dev server, complete full authenticated mailbox smoke,
  then configure cron-job.org and enable rules only after manual evaluation.
