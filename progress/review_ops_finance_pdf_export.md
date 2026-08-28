# Review - Feature 31 Finance PDF export

## Result

Approved locally.

## Evidence

- `pnpm check:finance` passed.
- `pnpm check:finance-pdf -- --write-sample` passed.
- Direct TypeScript and focused ESLint passed.
- `pnpm build` passed after network access allowed Next to fetch Geist.
- One-page and four-page samples were rendered with Poppler and visually
  inspected: accents, alignment, wrapping, page transitions, repeated headers,
  footer numbering, and voided-row treatment were correct.
- Authenticated `/dashboard/financial` smoke confirmed `Exportar PDF` visible
  and enabled, a success toast after click, and no browser console errors.
- Temporary PDFs and PNGs were removed after inspection.

## Review notes

- The export uses the same summary object shown on screen, preventing a second
  calculation contract.
- Client-only generation avoids a new download API and does not expand server
  permissions or data access.
- Concurrent Feature 32 files and harness history were preserved unchanged.
