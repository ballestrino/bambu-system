# Implementation Report - mail_official_budget_search_and_sources

Status: done

## Implemented

- Added a strict Responses function tool that accepts service, frequency,
  visits, hours, employees, and nullable product inclusion criteria.
- Searches are bounded to current immutable versions of active official
  budgets and classify exact, partial, ambiguous, incomplete, and no-result
  evidence. Unspecified products retain both applicable options.
- Luna may quote only exact tool results. Selected option IDs are validated
  against returned evidence and monetary amounts are rejected when invented or
  changed before persistence.
- Added immutable `MailDraftRevision` and `MailDraftSource` records linked to
  official versions and options with restrictive foreign keys and SQL guards.
- Added an internal bibliography with generator origin, conditions, products,
  prices, version, workload, weekly 4.32 multiplier, and source-use date.
- Manual price changes show a visible mismatch warning and are audited on
  manual send. Grounded official prices may enter a user-confirmed automation
  rule; quoted prices without a persisted official source are blocked at rule
  creation, queueing, and the final automatic-delivery boundary.

## Verification

- `check-mail-official-budget-sources.ts`: passed exact, product variants,
  partial, ambiguous, incomplete, no-result, mismatch, no-invention,
  grounded-price automation, restrictive relations, and immutability assertions.
- Existing `check-mail-agent.ts`: passed.
- Prisma validation, TypeScript, repository lint, production build (27 pages),
  final `init.ps1`, and `git diff --check`: passed.
- Authenticated `/dashboard/email` smoke generated an exact source-backed
  response with Luna xhigh, displayed the internal bibliography, and preserved
  it after the official budget was archived. No email was sent.
- Manual mismatch UI and grounded-rule eligibility were exercised. The master
  automatic-send switch remained off throughout the smoke.

## Development Boundary

- Datasource readback confirmed Neon project `icy-feather-44746760`, branch
  `br-royal-band-acu9vn62`, and endpoint `ep-patient-recipe-acv90rwo`; the user
  explicitly confirmed this branch is development.
- Migration `20260825120000_mail_official_budget_sources` was applied there.
  Post-deploy Prisma status reports 16/16 migrations applied; readback reports
  15 Mail tables, 4 OfficialBudget tables, and no rolled-back migrations.
- No production write, seed, commit, push, or deployment occurred.
- Both synthetic mail threads, both duplicate test rules, and the one official
  budget created for the smoke were removed after validation. Readback returned
  zero remaining fixture threads, rules, and official budgets; the source
  generator was preserved.
