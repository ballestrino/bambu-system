# Review Report - mail_conversational_draft_editor

Status: approved

## Final-State Review

- Authorization is enforced by `requireAdminSession()` on every new action;
  client input is bounded through Zod before persistence or OpenAI use.
- Revisions are append-only in application code and database-protected against
  update/delete. `FOR UPDATE` plus a unique suggestion/revision index prevents
  duplicate concurrent version numbers.
- Feedback rows identify the exact immutable revision, and the SQL guard
  prevents a revision from another suggestion being attributed accidentally.
- Manual and restored drafts copy bibliography relations. Luna revisions retain
  current sources and validate every quoted amount before persistence.
- Draft changes cancel pending automation; attachment, sender, recipient,
  safety, protected-literal, official-source, and exact-price checks remain in
  the creation, matching, and delivery boundaries.
- Send-from-Bambú resolves or creates the exact revision before SMTP and records
  `BAMBU_SENT` only after successful delivery. External-use records
  `EXTERNAL_SENT` without invoking SMTP. Copy records only `COPIED`.
- Data loading keeps list rows light while the selected thread receives its
  complete revision history and per-version bibliography.

## Verification Review

- Focused checks, Prisma, full ESLint, production build/TypeScript, final
  harness init, migration readback, authenticated desktop smoke, and 390-by-844
  responsive smoke are green.
- Browser interactions deliberately avoided Guardar, Restaurar, feedback
  submission, automation confirmation, and SMTP; persistence behavior is
  covered by transactions, schema guards, focused assertions, and build types.
- Temporary QA assets were removed, the development datasource contains no
  Feature 23 smoke records, and production, email delivery, automation state,
  git commits, pushes, and deployment remain unchanged.

## Decision

- Acceptance criteria are satisfied and Feature 23 is approved for local
  closure with its additive migration applied only to Neon development.
