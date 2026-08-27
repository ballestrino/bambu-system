# Implementation Report - mail_conversational_draft_editor

Status: done

## Implemented

- Kept `MailSuggestion` as the conversation root and made every AI revision,
  manual save, and restore append an immutable `MailDraftRevision` with origin,
  administrator instruction, actor, and restore provenance.
- Added exact-revision feedback and outcome persistence for useful, not useful,
  copied, saved, externally sent, and sent from Bambú. `No sirve` requires a
  reason and accepts an optional comment; copying does not approve or send.
- Added admin-only Server Actions for manual saves, bounded-history Luna
  revisions, restores, and explicit outcomes. OpenAI remains `store: false` and
  receives only the inbound message, current draft, three recent revisions,
  current sources, and the requested change.
- Preserved official-budget sources across manual, conversational, and restored
  revisions. Price mismatches remain visible and now fail closed at rule
  creation, automation matching, and queue delivery.
- Added row locking and transaction-safe revision numbering. Any new revision
  cancels queued or processing automation so an edited draft is never silently
  substituted into an existing automatic-send decision.
- Replaced the one-shot card with subject/body editing, a Luna instruction box,
  complete revision history, restore controls, per-revision bibliography, and
  separate Guardar, Sirve, No sirve, Copiar, external-use, Bambú-send, and
  automation-confirmation controls.

## Persistence

- Added migration `20260825170000_mail_conversational_draft_editor` with revision
  metadata, exact feedback relations, six explicit outcomes, indexes, foreign
  keys, and a database trigger that rejects feedback/revision mismatches.
- The effective endpoint was verified through Neon as development branch
  `br-royal-band-acu9vn62`; the migration was applied only there. Readback
  confirmed all six columns and both revision/feedback guards.
- Production was not changed.

## Verification

- `check-mail-conversational-drafts.ts`, existing mail-agent checks, and
  official-budget source checks passed.
- Prisma validation, repository ESLint, harness validation, final `init.ps1`,
  TypeScript inside the Next production build, and the 27-route build passed.
- Authenticated desktop and 390-by-844 Playwright fixture smoke exercised the
  real editor component without database fixtures: dirty-state guards,
  history/restore affordance, negative-feedback fields, distinct outcomes, and
  responsive containment passed with zero console errors and 375/375 width.
- The private smoke route, temporary auth helper/cookie, browser session,
  server, and 13 generated Playwright artifacts were removed after validation.
  No draft, feedback, rule, queue item, or email was created or sent.
