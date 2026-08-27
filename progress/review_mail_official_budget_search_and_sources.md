# Review Report - mail_official_budget_search_and_sources

Status: approved

## Findings

- Search reads only active official budgets and refuses stale non-current
  versions. Classification and nullable product behavior match the contract.
- Exact source IDs are checked application-side before an amount can be stored;
  incomplete, partial, ambiguous, and no-result searches cannot become price
  evidence.
- Revision/source persistence is append-only at the application boundary and
  protected against update/delete and mismatched option/version pairs in SQL.
- Bibliography remains outside the customer body, historical relations use
  restrictive foreign keys, and archived generator identity remains readable.
- Price automation is allowed only with a persisted official source and a
  confirmed matching rule, and remains fail-closed at creation, matching, and
  delivery when grounding is absent. Manual mismatches are visible and audited.
- Auth, existing mail behavior, file-size guidance, build, lint, TypeScript,
  Prisma, focused checks, and responsive empty-state smoke are green.

## Browser Evidence

- An authenticated local draft used Luna with `xhigh` reasoning and reproduced
  the official net, IVA, final, and hourly values without modification.
- Its internal bibliography showed the immutable version, option conditions,
  weekly 4.32 factor, use date, and generator origin without adding the source
  text to the customer-facing body.
- A manual total change displayed the mismatch warning. Confirming “Perfecta”
  created grounded matching rules while the global automatic-send switch stayed
  off; no message was sent or queued for delivery.
- After archival and generator detachment, the draft still rendered its complete
  historical source and identified the generator origin as archived.
- Cleanup removed exactly two synthetic threads, two test rules, and one test
  official budget. A readback confirmed zero matching records remained.

## Closure Decision

- The effective Neon branch was user-confirmed as development and migration
  `20260825120000_mail_official_budget_sources` was applied successfully.
- The authenticated acceptance evidence and cleanup are complete. Feature 22 is
  approved for closure; production remains unchanged.
