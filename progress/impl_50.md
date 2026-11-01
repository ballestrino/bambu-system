# Implementación - billing_default_dates (feature 50)

Rama `claude/billing-side-editor-dates`, sobre la 49 (`5922c08`).

## Decisiones del usuario (2026-11-01)

- Emitida después del 10: vence a los 5 días de la emisión.
- Las de contado pasan a crédito con ese vencimiento (se puede volver a
  contado en el formulario).
- Escritas en `docs/billing.md` antes de implementar.

## Qué hace

- `lib/billing/invoice-dates.ts` (puro): emisión = hoy, o el 1 del mes si se
  factura un mes que no empezó; vencimiento = el 10 del mes de emisión, o a
  5 días si se emite después del 10. `resolveDraftDates` (elegidas o por
  defecto) y `pickExplicitDates` (guardar solo lo que difiere de la regla).
- Lote: `issue-run` resuelve las fechas con el mes del borrador; un
  borrador de diciembre emitido el 1 de noviembre sale el 01/12 y vence el
  10/12, y cuenta en el resumen de diciembre.
- Repetir el mes y las e-Facturas nuevas del agente (`draftInvoices`) se
  guardan a crédito. La fila muestra "Crédito · vence 10/12"; la barra y el
  diálogo de "Emitir" dicen con qué fecha salen y cuándo vencen.
- Nueva factura arranca a crédito con las fechas de la regla para el mes
  elegido; mover la emisión mueve un vencimiento que seguía la regla (uno
  elegido a mano se respeta). Guardar en el borrador guarda las fechas solo
  si difieren de la regla.
- Editor lateral (49) y `fillInvoiceForm` usan la misma regla; la habilidad
  Nueva factura lo explica.

## Verificación

- PASS: `tsc --noEmit`, `pnpm lint`, `pnpm check:billing` (con
  `billing-dates-checks.ts`: la regla con cruces de mes y año, fechas
  elegidas, vencimiento antes de la emisión, guardar solo lo distinto y el
  lote emitiendo diciembre el 1/11 con un Biller falso), checks del agente
  (tools, page, proposals, pricing, cost-estimate, memory, instructions).
  `check:agent-sheet` falla como antes (busca un `Header.tsx` que se quitó
  en la 36).
- Biller test desde Chromium con `next dev` y un Postgres local:
  "Repetir noviembre" en diciembre dejó las 4 a crédito; la barra dice
  "emisión 1 dic, vencen el 10 dic", la fila "Crédito · vence 10/12", el
  diálogo "Emisión 01/12/2026 · a crédito vencen el 10/12/2026" y el editor
  01/12 y 10/12 con Crédito. Se emitieron un e-Ticket que en noviembre fue
  de contado (MT 965026) y una e-Factura (MF 673321): el detalle de Biller
  trae `fecha_emision` 2026-12-01 y `fecha_vencimiento` 2026-12-10, y el
  resumen de diciembre las cuenta.
- Nueva factura: diciembre abre 01/12 y 10/12 a crédito; emisión 15/12 →
  vence 20/12; noviembre (hoy 1/11) abre 01/11 y 10/11.
- A revisar: la e-Factura con fecha 01/12 seguía "Pendiente DGI" a los 6
  minutos (la del día se aceptó en minutos); puede que Biller o DGI la
  procesen recién el día de emisión.
