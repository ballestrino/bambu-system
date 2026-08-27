# Review Report - official_budget_versioning

Status: approved for local closure

## Acceptance Review

- Persistence is separate from mutable generator budgets and options, and all
  new monetary columns use Decimal.
- Publication creates version 1 atomically. A linked generator edit and its
  recreated options produce the next immutable version in the same transaction.
- Version options contain the required service, cadence, workload, product,
  price, tax, hourly, input, and calculation audit data without source option
  relations or IDs.
- Weekly workload applies 4.32 and derived monthly values are explicitly
  estimates; stored official final prices are explicitly authoritative.
- Archive disconnects the generator and preserves versions. Action and database
  contracts reject deletion while the active link exists.
- Reads, publication, archive, and linked generator mutation paths have explicit
  server-side authorization; inputs, actors, versions, and lifecycle changes are
  validated or audited.
- Publication and generator edits serialize on the generator row; append and
  archive use conditional updates so an archived budget cannot receive a late
  version.

## Evidence

- Focused checks exercise snapshot calculations, immutable version 1 after
  recreated option IDs, version 2, archive history, deletion guards, restrictive
  migration SQL, and immutable snapshot triggers.
- Prisma schema validation, TypeScript, repository lint, and production build
  passed.
- The read-only semantic diff verified the modeled migration delta. The local
  SQL additionally contains immutable-snapshot triggers, which Prisma does not
  represent in its datamodel diff.

## Boundary

- This approval covers the local backend feature and migration artifact only.
  It does not claim database application, deployment, or the Feature 21 UI.
