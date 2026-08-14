# Current Harness Session

Status: in_progress

## Active Feature

Feature 19 - `shared_mail_ai_agent`

## Product Contract

- Build an administrator-only shared Hostinger mailbox at `/dashboard/email`.
- Keep the interface operational and compact: Inbox, Sent, Archive, threads,
  search and filters, read or unread, archive, compose, reply, reply-all,
  forward, attachments, and send; do not reproduce a complete webmail.
- Import the last three months from INBOX, Sent, and Archive. Exclude Spam,
  Trash, and Drafts. Sync manually and every 15 minutes through a protected
  cron-job.org endpoint compatible with Vercel Hobby.
- Limit attachments to 4 MB total. Larger files retain metadata and hand off to
  Hostinger. Attachment mail never reaches AI or automatic sending.
- Use OpenAI Responses with `gpt-5.6-terra`: `high` performs structured triage
  and drafting, while messages it classifies as complex rerun with `xhigh` and
  always remain manual. Use `store: false` and a stable safety identifier.
- Retrieve relevant previous sent replies and approved shared memory. Any
  extracted memory remains pending until an administrator approves it.
- Let administrators mark a reply as perfect and confirm an automation rule
  for identical or very similar messages. The global automatic-send switch is
  initially off.
- Require 0.95 exact or semantic similarity plus Terra intent, confidence, and
  safety gates. Preserve protected numbers, prices, conditions, and deadlines.
- Exclude attachments, lists, no-reply, multi-recipient mail, unknown senders,
  payments, prices, complaints, legal, HR, cancellations, and commitments.
- Queue safe auto replies only during Montevideo hours: weekdays 07:00-21:00,
  weekends 10:00-16:00. A new follow-up cancels or regenerates the queue item.
- Audit import, sync, draft, review, edit, feedback, memory, rule, queue, send,
  failure, and cancellation events.

## Architecture Contract

- Credentials remain server-only environment variables; Prisma stores mailbox
  state, messages, metadata, suggestions, memories, rules, queue, and audit.
- IMAP import and incremental sync are bounded, resumable, leased, idempotent,
  and shared by manual and cron entry points.
- SMTP delivery records state before sending and appends successful messages to
  Hostinger Sent without duplicating later sync.
- Embeddings plus Neon pgvector handle semantic retrieval; pg_trgm and
  normalized hashes handle lexical and exact matching.
- Leave Resend authentication mail and the current budget-chat model untouched.
- Full design and environment contract: `docs/email-agent.md`.

## Repository State

- Feature 18 is closed with focused checks, build evidence, final init, and
  authenticated desktop plus mobile smoke on all four protected surfaces.
- The working tree already contains completed Feature 10 follow-ups, Feature 18,
  and dark-theme changes. Preserve them and avoid unrelated rewrites.
- Added the Feature 19 Prisma domain, additive SQL migration, IMAP/MIME/SMTP
  dependencies, transport services, OpenAI services, actions, cron route,
  admin workspace, sidebar entry, focused checks, and environment template.

## Implementation Checkpoint

- Custom mailbox folders can now be collapsed from their section header.
- Every movable thread in the list has a checkbox and a three-dot menu for
  moving or archiving it without opening the thread. The bulk toolbar selects
  visible movable threads and moves, archives, or restores up to 50 together.
- Thread moves now refresh the current mailbox view without navigating to the
  destination folder. Bulk IMAP work shares one connection and remains audited
  per thread.
- Archive is now always offered. If Hostinger does not advertise an Archive
  special-use folder, the first archive operation prepares `INBOX/Archive` and
  resolves it as the standard Archive destination.
- Added real Hostinger folder organization without bulk-importing custom-folder
  history. Sync discovers and registers safe custom folders while excluding
  special-use Drafts, Junk, and Trash.
- A thread can be moved from the detail toolbar to Inbox or any registered
  custom folder. IMAP MOVE results preserve destination UIDVALIDITY and UID
  mappings, local folder views update immediately, and each move is audited.
- `/dashboard/email` now lists 16 discovered Hostinger folders in a compact
  scrollable section. Folder routes retain search and thread selection; the
  current destination is disabled in the move menu.
- Fixed Hostinger INBOX messages sent by the shared address being misclassified
  as outbound. Folder semantics now win, existing rows repair idempotently, and
  manual sync reports updated records plus partial historical import status.
- Independent root messages no longer merge only because subject and
  participants match. Two current `Petición de servicio Web` messages were
  separated from the May/July historical thread, and all 123 existing thread
  timestamps were recalculated with a unified received-or-sent message date.
- Self-addressed website forms now extract the labeled `Email:` recipient for
  manual reply and suggestion use; the UI does not offer a reply action when no
  external address can be established.
- `/dashboard/email` now contains Inbox, Sent, Archive, search, thread reading,
  read or unread, archive or restore, compose, reply, reply-all, forward,
  incoming attachment download, outgoing attachments, AI suggestions, feedback,
  memory review, rules, queued count, and the automatic-send master switch.
- IMAP import and sync are limited to INBOX, Sent, and Archive, import three
  months, process bounded batches, persist folder cursors, deduplicate by UID
  identity plus Message-ID, and use a shared lease.
- Messages or attachments over 4 MB keep metadata and require Hostinger. No
  attachment content is sent to OpenAI or eligible for automatic replies.
- SMTP writes a local queued record before delivery, records failure or sent
  state, appends the MIME message to discovered Hostinger Sent, and later IMAP
  sync reconciles the local message by Message-ID.
- Terra high returns a strict structured reply and memory proposal. Messages
  classified complex rerun with xhigh and stay manual. Requests use
  `store: false` and a hashed safety identifier.
- Retrieval combines thread and subject history, approved memory, confirmed
  rules, and pgvector similarity over previously sent replies. Historical sent
  replies are embedded in bounded background batches after initial import.
- Auto replies require a confirmed rule, 0.95 similarity, matching intent,
  confidence and safety at least 0.95, known single sender, protected literals,
  active global switch and rule, and an open Montevideo sending window.
- Queued items use idempotency and leases; a new follow-up, paused rule, closed
  master switch, or closed sending window prevents delivery.
- `/api/mail/cron` is public only at the proxy boundary and enforces its own
  bearer secret. An unauthenticated request returns 401.

## Migration Checkpoint

- Local migration:
  `prisma/migrations/20260813223000_shared_mail_ai_agent/migration.sql`.
- Neon migration ID: `57d8b5d1-ab46-4f78-b2ac-29fc17e64230`.
- Temporary branch: `mcp-migration-2026-08-13T22-03-48`.
- Temporary branch ID: `br-snowy-forest-ac5f7u9o`.
- Parent production branch ID: `br-sparkling-night-acqea90i`.
- The migration executed successfully in the temporary branch. Readback found
  13 Mail tables, pg_trgm and vector, three HNSW vector indexes, and both
  critical MailMessage columns. Production has not been changed.
- The Neon workflow requires explicit user approval before promoting this
  tested migration to production or discarding the temporary branch.

## Next Checkpoint

1. Obtain explicit approval to promote or discard migration
   `57d8b5d1-ab46-4f78-b2ac-29fc17e64230`.
2. Configure the Hostinger IMAP/SMTP values and `MAIL_SYNC_CRON_SECRET`; the
   existing `OPENAI_API_KEY` is present.
3. After stopping and restarting the user-owned dev server, run Prisma generate,
   complete the authenticated empty and imported mailbox smoke, and configure
   cron-job.org only after the manual sync is verified.

## Verification Required To Close

- Focused sync, dedupe, schedule, safety, protected-literal, retrieval, and
  automation checks.
- Prisma validation and controlled migration verification.
- TypeScript, ESLint, production build, and final `\.\init.ps1`.
- Authenticated desktop and responsive browser smoke for authorization,
  configuration, loading, empty, thread, draft, manual send, memory, rule,
  queue, failure, and retry states that can be exercised safely.

## Verification So Far

- Final `\.\init.ps1` passes harness validation, Prisma validation, and the
  repository-wide ESLint check; the harness intentionally skipped build.
- The latest mailbox UX checks pass focused mail-agent assertions, TypeScript,
  and repository-wide ESLint.
- Authenticated browser smoke confirmed folder collapse and expansion, enabled
  per-thread three-dot move/archive actions, two-thread selection, enabled bulk
  move/archive controls, and an Archive destination without executing any live
  move. The URL remained on the Inbox throughout these non-mutating checks.
- Responsive smoke at a 390-by-844 viewport confirmed the controls remain
  visible with two selected threads, no horizontal overflow, and no browser
  console errors. A `min-w-0` grid constraint was added after the first smoke
  exposed a 608-pixel minimum-content width.
- The selected-thread highlight now uses an inset ring so its rounded border is
  fully visible inside the scroll viewport. Mobile smoke confirmed both side
  edges on two selected cards with no horizontal overflow or console errors.
- Live Hostinger capability readback confirms MOVE, UIDPLUS, and LIST-EXTENDED.
  Folder registration stored 16 safe custom folders without importing their
  historical messages or moving any live message.
- Authenticated browser smoke confirms 16 folder links, 17 move destinations
  including Inbox, the current Inbox destination disabled, and an empty custom
  folder route rendering without application errors. No real message was moved
  because the business destination was intentionally left for the user.
- Folder resolution checks exclude special-use Drafts and no-select containers,
  preserve nested labels, and pass with the broader focused mail checks.
- Final folder-change verification passes `tsc --noEmit`, the focused mail
  script, harness validation, Prisma validation, and repository-wide ESLint;
  the harness intentionally skipped the production build.
- Live readback found 9 INBOX messages: the two hidden web requests were the
  only rows incorrectly stored as outbound. Repair readback now shows all 9 as
  INBOUND/RECEIVED and zero outbound rows in INBOX.
- Authenticated browser smoke shows two separate August web-request entries.
  The selected request contains one message, no May content, and the reply
  dialog resolves a valid external recipient; the dialog was closed unsent.
- Focused mail checks, focused ESLint, and `tsc --noEmit` pass after the sync,
  threading, chronological ordering, and reply-recipient corrections.
- Final `\.\init.ps1` passes harness validation, Prisma validation, and the
  repository-wide ESLint check; the harness intentionally skipped build.
- `pnpm check:mail-agent` passes normalization, exact hashes, protected
  literals, sensitive topics, sender and recipient exclusions, and Montevideo
  weekday and weekend windows.
- Prisma validation, TypeScript, ESLint, and the direct Next production build
  pass. The build includes `/dashboard/email`, `/api/mail/cron`, and the
  authenticated attachment download route.
- Authenticated desktop and 390-by-844 browser smoke confirm the safe pending-
  migration state with no horizontal overflow. Full mailbox states wait for the
  approved migration, Hostinger configuration, and server restart.
- `prisma generate` cannot replace its Windows engine DLL while the user's dev
  server is running. The generated types were updated before that engine rename;
  the current old process therefore shows a controlled restart-required state.
