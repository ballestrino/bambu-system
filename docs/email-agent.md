# Shared Mail AI Agent

This is the durable product and architecture contract for Feature 19.

## Product Boundary

- Route: `/dashboard/email`, visible only to administrators.
- One shared Hostinger mailbox; credentials remain in server environment
  variables and never enter Prisma or the browser.
- This is a compact operational mail panel, not a full webmail replacement.
- Views: Inbox, Sent, Archive, and discovered safe Hostinger folders; search
  and practical status filters.
- Actions: read or unread, move to a real mailbox folder, archive, compose,
  reply, reply-all, forward, and send.
- All administrators share the same mailbox, memory, rules, and audit trail.

## Mail Transport

- Import the latest three months from INBOX, Sent, and Archive.
- Exclude Spam, Trash, and Drafts from import, suggestions, and rules.
- Discover custom folders without bulk-importing their historical contents.
  Moving a thread updates Hostinger through IMAP MOVE and keeps the returned
  UIDPLUS identity so it can be moved or marked read again later.
- IMAP sync is resumable, bounded, leased, and idempotent by folder identity
  plus provider UID data; RFC message identifiers provide secondary dedupe.
- Manual `Volver a revisar` and the cron endpoint call the same sync service.
- The protected endpoint is designed for cron-job.org every 15 minutes because
  the application runs on Vercel Hobby.
- SMTP sends are persisted and appended to the Hostinger Sent folder.
- Attachments are capped at 4 MB total. Larger messages keep safe metadata and
  send the administrator to Hostinger for the full operation.
- Attachments are never supplied to AI and never qualify for automatic send.

## OpenAI Contract

- API: Responses API with `gpt-5.6-luna`.
- Every structured triage and reply draft uses `reasoning.effort: xhigh`.
- Complex replies use the same model and effort and remain manual-review-only.
- Complex replies always remain manual, even when a rule is similar.
- Requests use `store: false` and a stable, pseudonymous safety identifier.
- Structured output records intent, complexity, risk, confidence, reasons,
  subject, body, protected literals, and whether manual review is required.
- Current budget-chat model and Resend authentication emails are unchanged.

## Memory And Learning

- Previous administrator-sent replies are retrieval examples, not model
  fine-tuning and not unconditional truth.
- Approved memory contains shared style, policy, contact, and organization
  facts with source and validity metadata.
- AI-extracted memory starts as `PENDING`; an administrator must approve it.
- Usefulness, rejection reason, copying, saving, external use, Bambú sending,
  and automation confirmation remain distinct events; copying never implies
  approval or sending.
- Embeddings plus Neon `pgvector` provide semantic retrieval; `pg_trgm` and
  normalized hashes support lexical and exact matching.

## Automatic Reply Rules

- The global automatic-send switch starts off.
- A rule is created only after an administrator marks a reply as perfect and
  confirms that identical or very similar messages may be answered directly.
- A candidate needs exact or semantic similarity at or above 0.95 plus Luna
  intent, safety, and confidence approval at or above 0.95.
- Only known single senders qualify. Multi-recipient mail, lists, no-reply,
  attachments, and suspicious headers are excluded.
- Payments, prices, complaints, legal matters, HR, cancellations, promises,
  and new commercial commitments always require manual review.
- Names, greeting, dates, and immediate context may adapt. Numbers, prices,
  conditions, deadlines, and other protected literals may not change.
- Sending hours use `America/Montevideo`: weekdays 07:00-21:00 and weekends
  10:00-16:00. Outside that window, approved replies wait in the queue.
- A new inbound follow-up cancels or regenerates the queued automatic reply.

## Reliability And Audit

- Import, sync, folder move, suggestion, approval, edit, rejection, rule creation, rule
  match, queue, send, failure, cancellation, and memory review are audited.
- Cron and manual services use leases, bounded batches, retryable errors, and
  idempotency keys so concurrent executions cannot duplicate mail.
- UI exposes configuration, empty, loading, retry, partial-import, queued,
  failed, manual-review, and sent states without leaking credentials.

## Conversational Drafts

- `MailSuggestion` is the conversation root and `MailDraftRevision` is its
  immutable history. Manual saves, Luna revisions, and restorations always
  append a version instead of overwriting prior text.
- Luna receives the incoming message, the current draft, at most three recent
  revisions, the administrator instruction, and current official sources.
  Responses remain `store: false`.
- Every revision owns its bibliography. Restoring or manually editing a draft
  copies those durable source relations; an edited price mismatch stays
  visible and cannot become an automatic reply.
- `Sirve` records usefulness only. `No sirve` requires a reason and permits an
  optional comment. `Copiar`, `Guardar`, `Envié por mi cuenta`, and `Responder
  desde Bambú` are separately audited against the exact revision.
- Editing a draft cancels pending or processing automation queue rows. Only
  the separate `Perfecta: automatizar similares` confirmation can create a
  rule, and all sender, recipient, attachment, safety, protected-literal, and
  official-price gates still run.

## Environment Contract

- `HOSTINGER_IMAP_HOST`, `HOSTINGER_IMAP_PORT`, `HOSTINGER_IMAP_SECURE`
- `HOSTINGER_SMTP_HOST`, `HOSTINGER_SMTP_PORT`, `HOSTINGER_SMTP_SECURE`
- `HOSTINGER_MAIL_USER`, `HOSTINGER_MAIL_PASSWORD`
- `HOSTINGER_MAIL_FROM`, `HOSTINGER_SENT_FOLDER`
- `OPENAI_API_KEY`, `MAIL_SYNC_CRON_SECRET`

## Delivery Order

1. Add persistence, indexes, vector and trigram extensions, and migration.
2. Add lazy mail and OpenAI infrastructure plus environment validation.
3. Add shared IMAP import or sync, SMTP send, queue, and protected cron route.
4. Add drafting, retrieval, pending memory, feedback, and rule safety gates.
5. Add the compact admin workspace and sidebar entry.
6. Verify focused domain checks, Prisma, TypeScript, lint, build, migration,
   authorization, and authenticated responsive browser flows.
