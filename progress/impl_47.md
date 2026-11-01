# Implementación - billing_delete_archive (feature 47)

Rama `claude/elegant-edison-wmcobi`, sobre `main` f621317. El código lo
empezó el implementer en local (commit WIP `92a862c`, rama
`feature/47-billing-delete-archive`) y se terminó en cloud.

## Qué hace

- **Borrar del borrador.** Una factura `DRAFT` de un lote `DRAFT` se borra
  con confirmación ("Borrar" en la fila de escritorio, "Borrar del borrador"
  en la hoja del teléfono). En el servidor, `deleteDraftInvoice`
  (`lib/billing/invoice-remove-store.ts`) toma el lock del mes y el del lote
  (el de "Emitir N"), relee, compara `updatedAt`, borra con `deleteMany`
  condicionado a `DRAFT` y ese `updatedAt`, mueve el `updatedAt` del lote y
  audita `invoice.delete` en la misma transacción. Una emitida, en curso o
  sin confirmar nunca se borra, la mande quien la mande.
- **Archivar lo emitido.** `ISSUED`, `ACCEPTED` o `REJECTED` se archivan y se
  desarchivan (`Invoice.archivedAt` y `archivedById`, migración aditiva
  `20261101200000_billing_invoice_archive`). Sale de Emitidas y del borrador,
  sigue en el resumen del mes (`current` no se filtra) y la sincronización no
  toca `archivedAt`. "Archivadas · N" plegable debajo de Emitidas para
  desarchivar (la 48 lo reemplaza por la vista Archivadas). Archivar ofrece
  "Deshacer" en el aviso. Repetirlo no cambia ni vuelve a auditar.
- Reglas puras en `lib/billing/invoice-remove.ts`, acción de admin en
  `actions/billing/invoice-remove.ts`, esquemas en `schemas/billing.ts`,
  hooks en `components/billing/hooks/use-invoice-remove.ts` (borrar va en la
  cola de la fila y con la `mutationKey` que espera "Emitir").
- `eslint.config.mjs` ignora `.claude/**` (worktrees locales con su build).

## Verificación

- PASS: `tsc --noEmit`, `pnpm lint`, `pnpm check:billing` (con
  `billing-remove-checks`: reglas, store con un Prisma falso y fuente),
  `init.sh`, `pnpm build`.
- `scripts/smoke-billing-remove.ts` contra un Postgres 16 local con todas
  las migraciones: borrar mueve el lote, el "Emitir" viejo da `stale`, una
  emitida da `issued`, un `updatedAt` viejo da `stale`, archivada →
  sincronizada con `upsertBillerInvoice` sigue archivada y en el resumen,
  desarchivar, tres eventos de auditoría. Limpia lo que crea.
- Chromium con `next dev` sobre el Postgres local (borrador de noviembre
  repetido de octubre, una emitida aceptada y una rechazada; Biller con un
  token falso de test, así que la sincronización falla sin efecto):
  - 1440 px: "Emitir 4" abierto en una pestaña, borrar una fila en otra
    (4 → 3 marcadas, $ 50.508 → $ 35.868), confirmar el diálogo viejo →
    "El borrador cambió desde que abriste el diálogo" y recarga. En Emitidas
    hay "Archivar" y ningún "Borrar"; archivar la rechazada → "Archivadas · 1",
    el resumen sigue en $ 14.640 y "1 rechazada".
  - 390 px: sin scroll horizontal; borrar desde la hoja (3 → 2), archivar →
    "Deshacer" la devuelve, "Desarchivar" desde Archivadas. Sin errores de
    página.
  - Borrar todas las filas deja el borrador vacío con "Repetir octubre" para
    volver a llenarlo.

## Pendiente

- La migración está aplicada en la rama de Neon `feature-39-billing`; falta
  en producción antes del merge a `main`.
- La sincronización real contra Biller con una archivada (cubierta por el
  smoke con el store real, no contra Biller).
