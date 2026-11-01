# Implementación - billing_side_editor (feature 49)

Rama `claude/billing-side-editor-dates`, sobre `main` (`ff1ea63`).

## Qué hace

- Editor lateral de una factura del borrador: a la derecha en escritorio
  (760 px) y hoja casi a pantalla completa en el teléfono, con la factura
  entera en el formulario de Nueva factura (comprobante, fechas, forma de
  pago, cliente, ítems y adenda), anterior y siguiente sin cerrarlo.
- Se abre tocando el nombre del receptor en la fila, desde "Editar todos los
  campos" en la hoja de la fila del teléfono y con "Editar" en cada factura
  del diálogo de "Emitir", que queda abierto detrás.
- Arriba: "Contra octubre" (lo que cambió frente a la factura que repite,
  sin contar el mes que se movió solo) y "Quién la cambió" (las últimas 5
  ediciones, del agente o de una persona, con la hora y qué cambió).
- Pie: total con IVA, lo que falta, Borrar (47), Quitar del borrador /
  Volver a marcar, Descartar y Guardar.
- Guardar con lock del mes y del lote y compare-and-set sobre el
  `updatedAt` de la factura; mueve el del lote y audita `invoice.edit`. La
  página toma el `updatedAt` nuevo antes de releer, así el diálogo de
  "Emitir" no rechaza el cambio propio. Un cambio de otro lado se rechaza y
  el editor muestra la versión nueva.
- La fila guarda `issueDate`/`dueDate` solo si se eligieron distintas de las
  de por defecto (sin migración: las columnas ya estaban); el lote las usa.
- Auditoría por factura también en los cambios de detalle o precio de la
  fila y en `draftInvoices` del agente (`source: "agent"`).

## Archivos

- Nuevos: `lib/billing/invoice-dates.ts`, `lib/billing/draft-editor.ts`,
  `lib/billing/draft-editor-diff.ts`, `lib/billing/draft-editor-store.ts`,
  `data/billing/draft-invoice.ts`, `actions/billing/draft-editor.ts`,
  `components/billing/actions/draft-editor.action.ts`,
  `components/billing/hooks/use-draft-editor.ts`,
  `components/billing/draft-editor/*`, `scripts/billing-editor-checks.ts`.
- Cambiados: el lote (`issue-run`, `issue-store`, `issue-payload`) lee las
  fechas elegidas; `draft-update` y `agent-draft-store` auditan; filas,
  borrador, diálogo de emitir y "Borrar" (`onDeleted`).

## Verificación

- PASS: `tsc --noEmit`, `pnpm lint`, `pnpm check:billing` (con
  `billing-editor-checks.ts`: qué se edita, ida y vuelta sin redondear,
  cliente e ítems sin tocar quedan iguales, frases de cambios, "Contra
  octubre" sin el mes movido, schema y fuente de locks/auditoría).
- Chromium con `next dev` sobre un Postgres 16 local y Biller test (borrador
  de noviembre armado con `smoke-billing-draft.ts 2026-11 --keep`):
  - 1440 px: abrir desde la fila, cambiar el precio y guardar (la fila, la
    barra y "Quién la cambió" se actualizan); siguiente sin cerrar;
    recargar conserva el precio (base: 4724 → total 5763,28); con la factura
    cambiada en la base mientras estaba abierta, Guardar responde "Alguien
    cambió esta factura" y el editor muestra el precio nuevo (9999).
  - Desde "Emitir 2": Editar, cambiar el precio, Guardar, Escape cierra
    solo el editor; el diálogo sigue con "Emitir 2 · $ 7.488,36" (el total
    nuevo) y emite: MF 673320 y MT 965025 en Biller test, "2 emitidas".
  - 390 px: la hoja de la fila abre "Editar todos los campos", sin scroll
    horizontal (390/390), guardar y siguiente.
  - Sin errores de página ni de consola.
