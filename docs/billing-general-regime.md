# Facturación: paso a régimen general

Plan del 2026-11-16. Bambú dejó IVA mínimo (Literal E) y pasó a régimen
general: sus CFE ya no salen con CAE especial ni con el indicador 16, y cada
línea lleva IVA. Son las features 56 (facturación) y 57 (agente y
presupuestos) de `feature_list.json`. El contrato de la página sigue en
`docs/billing.md`; este documento es solo la transición.

Fecha que manda: el próximo lote se factura del 1 al 10 de diciembre (o el
30 de noviembre con fecha 1/12). La 56 tiene que estar en producción antes.

## Decisiones del usuario (2026-11-16)

1. **Vigencia:** el régimen general vale desde el 16 de noviembre de 2026
   inclusive. Lo emitido hasta el 15 es de IVA mínimo y queda como está.
2. **Precios:** al precio actual se le suma el 22 %. Bambú no absorbe el
   IVA, tampoco en los e-Tickets a consumidor final.
3. **Un solo régimen en la app.** No se construye soporte para varios
   regímenes: la app pasa a facturar solo en régimen general. Lo que quede
   afuera se hace en el panel de Biller, empezando por la nota de crédito de
   una factura emitida con IVA mínimo, que la app no emite.
4. **CAE nuevos:** los sube el contador.

## Qué cambia ante DGI y Biller

- **CAE.** DGI (Preguntas frecuentes de CFE v28, 3.2): "si deja de tributar
  IVA mínimo por pasar a tributar IVA Régimen general, deberá reportar como
  anulada la numeración no utilizada correspondiente a la constancia de IVA
  mínimo". Hacen falta CAE comunes para cada tipo que se usa (101, 102, 111,
  112), cargados en Biller (panel › Ajustes › CAEs, hoy régimen "IVA
  mínimo").
- **Encabezado del CFE.** Con IVA mínimo iba G-C5=2 (CAE especial) y
  A-C10=3 (montos brutos de IVA mínimo) (FAQ 4.39). En régimen general no va
  ninguno: Biller lo arma así cuando el pedido no trae `cae`.
- **Indicador.** El 16 ("ítem vendido por contribuyente IVA mínimo") deja de
  valer. Probado en test el 2026-10-30: una empresa de régimen general lo
  rechaza con "Indicador Facturación es inválido". Pasa a tasa básica:
  indicador 3, 22 %.
- **Montos.** `montos_brutos: 0` (lo que manda Bambú) significa precios sin
  IVA: Biller calcula el IVA y lo suma al total. No cambia.
- **PDF.** Deja de salir el recuadro "Contribuyente IVA MINIMO" (FAQ 8.16) y
  aparecen el IVA y el total con IVA. Lo arma Biller.
- **Numeración.** Es única por tipo de CFE: sigue con el CAE nuevo, puede
  cambiar la serie. La app no asume serie ni rango.

## Qué se rompe hoy en la app si no se hace nada

| Dónde | Qué pasa |
| --- | --- |
| `BILLER_CAE_ESPECIAL=2` en Vercel | Todo pedido sale con `cae.especial: 2`; sin CAE especial vigente Biller lo rechaza. Falla sin emitir nada mal |
| `buildRepeatDraft` (`draft-repeat.ts`) | "Repetir noviembre" copia las líneas con el 16: todas las de diciembre saldrían rechazadas una por una |
| `getLastIndicator` (`invoice-defaults.ts`) | El indicador por defecto es el de la última emitida (16): Nueva factura, `fillInvoiceForm` y `draftInvoices` del agente arrancan mal |
| `INDICATORS` (`new-invoice-items.tsx`) | "16 · IVA mínimo" es la primera opción del desplegable |
| `planCreditNote` (`credit-note-plan.ts`) | Una nota de una factura de noviembre copia el 16 de la línea y sale rechazada |
| `summarizeBillingMonth` | "Facturado neto" suma el total de Biller, que pasa a traer IVA: diciembre daría +22 % contra noviembre sin haber vendido más |
| Borradores abiertos | Uno repetido antes del cambio tiene el 16 guardado en sus filas |
| Agente | `LITERAL_E_NOTE` es obligatoria debajo de todo precio (`grounding.ts` rechaza el correo sin ella) y es regla protegida |

Lo que ya sirve: `getTaxRate` cobra 22 % con el 3, las filas muestran
subtotal sin IVA y total con IVA, el aviso de trabajo compara el precio sin
IVA del presupuesto con el subtotal sin IVA, y Biller test (PEPITO 12) es de
régimen general, así que test y producción pasan a comportarse igual.

## Feature 56: `billing_general_regime`

La app factura solo en régimen general. Sin migración.

- **Sin CAE especial.** Se quitan `BILLER_CAE_ESPECIAL`, `BILLER_CAE_CAUSAL`
  y `cae` de `biller-config`, `biller-server` y el emisor: ningún pedido
  manda `cae`. Las variables se borran de Vercel al desplegar.
- **Indicador fijo.** `DEFAULT_INDICATOR = 3` en `invoice-defaults.ts`
  reemplaza a `getLastIndicator` en Nueva factura
  (`data/billing/new-invoice.ts`), el contexto del agente
  (`lib/agent/context.ts`) y `agent-draft-store`. El 16 sale de `INDICATORS`
  y de la descripción de `fillInvoiceForm`
  (`schemas/agent-invoice-form-tools.ts`).
- **Repetir.** `buildRepeatDraft` pasa a 3 toda línea que venga con el 16 y
  deja el precio sin IVA igual: el total sube 22 % (decisión 2). La fila ya
  muestra el subtotal anterior, el nuevo y el total con IVA; el borrador suma
  un aviso "Primer mes con IVA: N facturas pasan a 22 % · + $ X de IVA".
  "Contra noviembre" del editor lateral no lo cuenta como cambio de una
  persona.
- **Freno antes de Biller.** `buildIssuePlan` rechaza:
  - una línea con el 16 ("Esta línea es de IVA mínimo: pasala a 22 %"), y
  - una fecha de emisión anterior al 16/11/2026 ("Antes del 16/11 Bambú era
    IVA mínimo: emitila desde el panel de Biller").
- **Borradores ya abiertos.** Antes de implementar se mira en producción si
  hay alguno con el 16. Si no hay, alcanza con el freno. Si hay, se suma
  "Pasar a 22 %" arriba del borrador (acción de admin, lock del mes y del
  lote, mueve el `updatedAt`, audita `invoice.edit`).
- **Notas de crédito.** `getCreditBlocker` bloquea una factura con alguna
  línea en el 16: "Se emitió con IVA mínimo: la nota de crédito se hace
  desde el panel de Biller" (decisión 3). `prepareCreditNote` del agente
  hereda el bloqueo. La nota hecha en Biller entra con la sincronización y
  marca la factura como hoy ("Anulada · NC …").
- **Resumen del mes.** "Facturado sin IVA" (la cifra grande y la que se
  compara contra el mes anterior), "IVA" y "Total". Sale de las líneas
  (`getItemsSubtotal`); una factura todavía sin ítems usa su total y se
  avisa. En los meses de IVA mínimo las tres coinciden, así que noviembre no
  cambia. `getBillingSummary` del agente trae los mismos tres importes.
- **Lo emitido con el 16 se sigue leyendo.** `getTaxRate(16)` sigue en 0 y
  las facturas de IVA mínimo se muestran, se archivan, se envían y se
  repiten igual.
- **`check:billing`:** `scripts/billing-regime-checks.ts` (repetir convierte
  el 16, los dos frenos de emisión, el bloqueo de la nota y el resumen con y
  sin IVA); `billing-config-checks` deja de probar el CAE especial.
- **Docs y memoria:** `docs/billing.md` (Literal E, CAE especial, tabla de
  entorno) y la memoria `biller-api-reference`.

Verificación:

- tsc, ESLint, `check:billing`, `pnpm harness`.
- Biller test con la copia de producción (`feature-39-billing`), que tiene
  las facturas reales de noviembre con el 16: repetir diciembre, ver todas
  en 22 % con el mismo precio sin IVA, emitir un e-Ticket y una e-Factura y
  esperar "Aceptado DGI"; PDF con IVA; nota de crédito de una de diciembre
  (indicador 3); nota de una de noviembre bloqueada.
- Chromium a 1440 y 390 px: aviso del borrador, resumen con los tres
  importes, formulario sin el 16.

## Feature 57: `literal_e_retirement`

La nota "Mientras la empresa continúe bajo régimen Literal E, se aplicará el
monto sin IVA" deja de ser cierta. Va después de la 56 y no la frena.

- `LITERAL_E_NOTE`, la línea de `formatBusinessProfile` y la regla de
  `system-prompt.ts`; `email-prompt.ts` (hoy "$ X + IVA" y la nota);
  `grounding.ts` (`missing_literal_e`) y `skills/emails.ts`; la regla
  protegida `literal_e`; el mensaje de `schemas/agent-tools.ts`; la línea
  138 de `lib/format-budget.ts`; los checks que la prueban
  (`agent-grounding-checks`, `check-agent-instructions`, `check-agent-tools`,
  `agent-price-format-checks`); `docs/agent.md`.
- A decidir por el usuario al empezarla: cómo se muestra un precio a un
  cliente. Propuesta: "$ 54.100 + IVA ($ 66.002 IVA incluido)", con los dos
  importes del cálculo como fuentes permitidas.
- Revisar a mano las instrucciones del equipo y la memoria del agente
  guardadas en la base que nombren Literal E, y la skill del PDF de
  presupuestos.
- Trabajos: `budgetIncludesIva` y la rentabilidad ya trabajan con el precio
  sin IVA; solo se revisa que ningún ingreso de Finanzas tome un total con
  IVA.

## Orden del corte

1. El contador carga los CAE comunes en Biller y anula en DGI la numeración
   sin usar del CAE de IVA mínimo.
2. Mergear y desplegar la 56, y borrar `BILLER_CAE_ESPECIAL` de Vercel. El
   despliegue es el corte: desde ahí la app emite solo en régimen general.
3. Emitir una sola e-Factura desde Nueva factura, esperar "Aceptado DGI" y
   mirar el PDF. Después, el lote de diciembre.

Si la 56 se despliega antes de que estén los CAE comunes, Biller responde
"No existe CAE" y no emite nada. Hasta desplegar la 56, lo que haga falta
facturar en régimen general se hace en el panel de Biller: desde el 16/11
la app en producción sigue pidiendo el CAE de IVA mínimo. Para que nadie
emita desde ahí por error, `BILLER_ISSUE_ENABLED=false` en Vercel apaga el
botón sin tocar la lectura.

## Fuera de la app

Para el contador, no para el código: declaración y pago mensual de IVA,
IRAE en lugar del pago fijo, pedir factura con RUT en las compras para
descontar el IVA, y avisar a los clientes el precio nuevo antes del primer
lote.

## Fuentes

- DGI, CFE Preguntas frecuentes v28:
  <https://www.efactura.dgi.gub.uy/files/descargar-todas-las-preguntas-frecuentes?es>
  (3.2, 4.39 y 8.16).
- API de Biller: <https://biller-labs.github.io/api-docs/> ("CAEs
  especiales", `montos_brutos`, `indicador_facturacion`).
